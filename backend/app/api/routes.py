from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import select, func, desc, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import *
from app.schemas import *
from app.core.deps import current_user, active_user, admin_user
from app.core.security import hash_password, verify_password, create_access_token
from app.services.money_service import (
    deposit,
    withdrawal,
    transfer,
    get_wallet,
    get_wallet_account,
)
from app.services.ledger_service import (
    add_entry,
    cash_account,
    ledger_balance,
    transaction_ledger_total,
)

import secrets
from app.models import User

router = APIRouter()


@router.post("/auth/register", response_model=AuthOut)
async def register(data: RegisterIn, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(409, "Email already registered")
    user = User(
        email=data.email,
        full_name=data.full_name,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.flush()
    seq = await db.scalar(select(func.nextval("wallet_number_seq")))
    wallet = Wallet(user_id=user.id, wallet_number=f"WAL-{seq}", currency="BDT")
    db.add(wallet)
    await db.flush()
    db.add(
        Account(
            account_type=AccountType.USER_WALLET,
            wallet_id=wallet.id,
            name=f"Wallet {wallet.wallet_number}",
            currency="BDT",
        )
    )
    await db.commit()
    return AuthOut(access_token=create_access_token(str(user.id)))


@router.post("/auth/login", response_model=AuthOut)
async def login(data: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == data.email))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return AuthOut(access_token=create_access_token(str(user.id)))

@router.post("/auth/forgot-password", response_model=ForgotPasswordOut)
async def forgot_password(
    data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
):
    user = await db.scalar(select(User).where(User.email == data.email.strip()))

    if user:
        reset_code = f"{secrets.randbelow(1_000_000):06d}"
        user.reset_code_hash = hash_password(reset_code)
        user.reset_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=2)
        user.reset_verified = False
        await db.commit()

        print(f"\nPassword Reset Code for {user.email}: "
              f"{reset_code}\n",
              flush=True)
        return ForgotPasswordOut(
            exists=True,
            message="Password reset code has been send in the terminal. Please check!",
        )

    return ForgotPasswordOut(
        exists=False,
        message="No account matched with this email address.",
    )


@router.post("/auth/verify-reset-code", response_model=PasswordResetOut)
async def verify_reset_code(
    data: VerifyResetCodeRequest, db: AsyncSession = Depends(get_db)
):
    user = await db.scalar(
        select(User).where(User.email == data.email).with_for_update()
    )
    if not user or not user.reset_code_hash or not user.reset_code_expires_at:
        raise HTTPException(400, "Invalid or expired reset code")

    expires_at = user.reset_code_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        user.reset_code_hash = None
        user.reset_code_expires_at = None
        user.reset_verified = False
        await db.commit()
        raise HTTPException(400, "Reset code has expired. Request a new code.")

    if not verify_password(data.code, user.reset_code_hash):
        raise HTTPException(400, "Invalid or expired reset code")

    user.reset_code_hash = None
    user.reset_verified = True
    await db.commit()
    return PasswordResetOut(message="Code verified. You may now reset your password.")


@router.post("/auth/reset-password", response_model=PasswordResetOut)
async def reset_password(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
):
    user = await db.scalar(
        select(User).where(User.email == data.email).with_for_update()
    )
    if not user or not user.reset_verified or not user.reset_code_expires_at:
        raise HTTPException(400, "Verify a reset code before changing your password")

    expires_at = user.reset_code_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        user.reset_code_hash = None
        user.reset_code_expires_at = None
        user.reset_verified = False
        await db.commit()
        raise HTTPException(400, "Reset verification has expired. Request a new code.")

    user.password_hash = hash_password(data.new_password)
    user.reset_code_hash = None
    user.reset_code_expires_at = None
    user.reset_verified = False
    await db.commit()
    return PasswordResetOut(message="Password changed successfully")


@router.get("/auth/me", response_model=UserOut)
async def me(user=Depends(current_user)):
    return user


@router.get("/wallet", response_model=WalletOut)
async def wallet(user=Depends(current_user), db: AsyncSession = Depends(get_db)):
    return await get_wallet(db, user.id, False)


@router.post("/deposits", response_model=DepositOut)
async def make_deposit(
    data: AmountIn, user=Depends(active_user), db: AsyncSession = Depends(get_db)
):
    try:
        await db.rollback()
        async with db.begin():
            tx, w = await deposit(db, user, data.amount)
        return DepositOut(
            reference_number=tx.reference_number,
            amount=tx.amount,
            balance=w.balance,
            status=tx.status.value,
        )
    except HTTPException:
        await db.rollback()
        raise


@router.post("/withdrawals", response_model=WithdrawalOut)
async def make_withdrawal(
    data: AmountIn, user=Depends(active_user), db: AsyncSession = Depends(get_db)
):
    try:
        await db.rollback()
        async with db.begin():
            tx, w, _ = await withdrawal(db, user, data.amount)
        return WithdrawalOut(
            reference_number=tx.reference_number,
            amount=tx.amount,
            status=tx.status.value,
            balance=w.balance,
        )
    except HTTPException:
        await db.rollback()
        raise


@router.get("/withdrawals")
async def my_withdrawals(
    user=Depends(current_user), db: AsyncSession = Depends(get_db)
):
    rows = (
        await db.execute(
            select(WithdrawalRequest, Transaction)
            .join(Transaction, WithdrawalRequest.transaction_id == Transaction.id)
            .where(WithdrawalRequest.requested_by == user.id)
            .order_by(desc(WithdrawalRequest.created_at))
        )
    ).all()
    return [
        {
            "reference_number": t.reference_number,
            "amount": w.amount,
            "status": w.status.value,
            "created_at": w.created_at,
        }
        for w, t in rows
    ]


@router.get("/transfers/{wallet_number}/receiver", response_model=ReceiverOut)
async def receiver(
    wallet_number: str, user=Depends(active_user), db: AsyncSession = Depends(get_db)
):
    row = await db.scalar(select(Wallet).where(Wallet.wallet_number == wallet_number))
    if not row:
        raise HTTPException(404, "Receiver wallet not found")
    u = await db.get(User, row.user_id)
    if u.status == AccountStatus.FROZEN or row.status == AccountStatus.FROZEN:
        raise HTTPException(403, "Receiver account is frozen")
    return ReceiverOut(wallet_number=row.wallet_number, full_name=u.full_name)


@router.post("/transfers", response_model=TransactionOut)
async def make_transfer(
    data: TransferIn,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    user=Depends(active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await db.rollback()
        async with db.begin():
            tx, _ = await transfer(
                db,
                user,
                data.receiver_wallet_number,
                data.amount,
                data.note,
                idempotency_key,
            )
        return TransactionOut.model_validate(tx, from_attributes=True)
    except HTTPException:
        await db.rollback()
        raise


@router.get("/transactions", response_model=list[StatementTransactionOut])
async def transactions(
    user=Depends(current_user),
    db: AsyncSession = Depends(get_db),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    transaction_type: str | None = Query(default=None),
):
    wallet = await get_wallet(db, user.id, False)
    account = await db.scalar(select(Account).where(Account.wallet_id == wallet.id))
    ids = (
        select(LedgerEntry.transaction_id)
        .where(LedgerEntry.account_id == account.id)
        .scalar_subquery()
    )
    q = select(Transaction).where(
        Transaction.id.in_(ids),
        Transaction.status.in_(
            [TransactionStatus.COMPLETED, TransactionStatus.REVERSED]
        ),
    )
    if start_date:
        q = q.where(
            Transaction.created_at
            >= datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
        )
    if end_date:
        q = q.where(
            Transaction.created_at
            < datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
            + __import__("datetime").timedelta(days=1)
        )
    if transaction_type:
        q = q.where(Transaction.transaction_type == transaction_type.upper())
    rows = (await db.execute(q.order_by(Transaction.created_at))).scalars().all()
    running = Decimal(0)
    result = []
    for tx in rows:
        entries = (
            (
                await db.execute(
                    select(LedgerEntry).where(
                        LedgerEntry.transaction_id == tx.id,
                        LedgerEntry.account_id == account.id,
                    )
                )
            )
            .scalars()
            .all()
        )
        debit = sum(
            (e.amount for e in entries if e.entry_type == EntryType.DEBIT), Decimal(0)
        )
        credit = sum(
            (e.amount for e in entries if e.entry_type == EntryType.CREDIT), Decimal(0)
        )
        running += credit - debit
        result.append(
            StatementTransactionOut(
                reference_number=tx.reference_number,
                transaction_type=tx.transaction_type.value,
                status=tx.status.value,
                amount=tx.amount,
                fee=tx.fee,
                total_amount=tx.total_amount,
                note=tx.note,
                created_at=tx.created_at,
                debit=debit,
                credit=credit,
                running_balance=running,
            )
        )
    return list(reversed(result))


@router.get("/dashboard", response_model=DashboardOut)
async def dashboard(user=Depends(current_user), db: AsyncSession = Depends(get_db)):
    wallet = await get_wallet(db, user.id, False)
    start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    rows = (
        (
            await db.execute(
                select(Transaction).where(
                    Transaction.initiated_by == user.id,
                    Transaction.status == TransactionStatus.COMPLETED,
                    Transaction.created_at >= start,
                )
            )
        )
        .scalars()
        .all()
    )
    deposits = sum(
        (x.amount for x in rows if x.transaction_type == TransactionType.DEPOSIT),
        Decimal(0),
    )
    withdrawals = sum(
        (x.amount for x in rows if x.transaction_type == TransactionType.WITHDRAWAL),
        Decimal(0),
    )
    transfers = sum(
        (x.amount for x in rows if x.transaction_type == TransactionType.TRANSFER),
        Decimal(0),
    )
    fees = sum(
        (x.fee for x in rows if x.transaction_type == TransactionType.TRANSFER),
        Decimal(0),
    )
    pending = (
        await db.scalar(
            select(func.count())
            .select_from(WithdrawalRequest)
            .where(
                WithdrawalRequest.requested_by == user.id,
                WithdrawalRequest.status == WithdrawalStatus.PENDING,
            )
        )
        or 0
    )
    return DashboardOut(
        balance=wallet.balance,
        wallet_number=wallet.wallet_number,
        currency=wallet.currency,
        today_count=len(rows),
        today_volume=deposits + withdrawals + transfers + fees,
        deposits=deposits,
        withdrawals=withdrawals,
        transfers=transfers,
        fees=fees,
        pending_withdrawals=pending,
    )


@router.get("/admin/dashboard", response_model=AdminDashboardOut)
async def admin_dashboard(
    admin=Depends(admin_user), db: AsyncSession = Depends(get_db)
):
    start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    active = (
        await db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.status == AccountStatus.ACTIVE)
        )
        or 0
    )
    frozen = (
        await db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.status == AccountStatus.FROZEN)
        )
        or 0
    )
    pending = (
        await db.scalar(
            select(func.count())
            .select_from(WithdrawalRequest)
            .where(WithdrawalRequest.status == WithdrawalStatus.PENDING)
        )
        or 0
    )
    rows = (
        (
            await db.execute(
                select(Transaction).where(
                    Transaction.status == TransactionStatus.COMPLETED,
                    Transaction.created_at >= start,
                )
            )
        )
        .scalars()
        .all()
    )
    deposits = sum(
        (x.amount for x in rows if x.transaction_type == TransactionType.DEPOSIT),
        Decimal(0),
    )
    withdrawals = sum(
        (x.amount for x in rows if x.transaction_type == TransactionType.WITHDRAWAL),
        Decimal(0),
    )
    transfers = sum(
        (x.amount for x in rows if x.transaction_type == TransactionType.TRANSFER),
        Decimal(0),
    )
    fees = sum(
        (x.fee for x in rows if x.transaction_type == TransactionType.TRANSFER),
        Decimal(0),
    )
    total = await db.scalar(
        select(func.coalesce(func.sum(Wallet.balance), 0))
    ) or Decimal(0)
    debit = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(
            LedgerEntry.entry_type == EntryType.DEBIT
        )
    ) or Decimal(0)
    credit = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(
            LedgerEntry.entry_type == EntryType.CREDIT
        )
    ) or Decimal(0)
    mismatches = 0
    wallets = (await db.execute(select(Wallet))).scalars().all()
    for w in wallets:
        a = await db.scalar(select(Account).where(Account.wallet_id == w.id))
        if a and w.balance != await ledger_balance(db, a.id):
            mismatches += 1
    return AdminDashboardOut(
        active_accounts=active,
        frozen_accounts=frozen,
        pending_withdrawals=pending,
        today_count=len(rows),
        today_volume=deposits + withdrawals + transfers + fees,
        deposits=deposits,
        withdrawals=withdrawals,
        transfers=transfers,
        fees=fees,
        total_money_in_system=total,
        ledger_total=credit - debit,
        reconciliation_mismatches=mismatches,
    )


@router.get("/admin/users")
async def admin_users(admin=Depends(admin_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(User, Wallet)
            .join(Wallet, Wallet.user_id == User.id)
            .order_by(User.created_at)
        )
    ).all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "status": u.status.value,
            "wallet_number": w.wallet_number,
            "balance": w.balance,
        }
        for u, w in rows
    ]


@router.post("/admin/users/{user_id}/freeze")
async def freeze(
    user_id: str, admin=Depends(admin_user), db: AsyncSession = Depends(get_db)
):
    await db.rollback()
    async with db.begin():
        u = await db.get(User, user_id, with_for_update=True)
        w = await db.scalar(
            select(Wallet).where(Wallet.user_id == user_id).with_for_update()
        )
        if not u or not w:
            raise HTTPException(404, "User not found")
        u.status = AccountStatus.FROZEN
        w.status = AccountStatus.FROZEN
    return {"status": "FROZEN"}


@router.post("/admin/users/{user_id}/unfreeze")
async def unfreeze(
    user_id: str, admin=Depends(admin_user), db: AsyncSession = Depends(get_db)
):
    await db.rollback()
    async with db.begin():
        u = await db.get(User, user_id, with_for_update=True)
        w = await db.scalar(
            select(Wallet).where(Wallet.user_id == user_id).with_for_update()
        )
        if not u or not w:
            raise HTTPException(404, "User not found")
        u.status = AccountStatus.ACTIVE
        w.status = AccountStatus.ACTIVE
    return {"status": "ACTIVE"}


@router.get("/admin/withdrawals/pending")
async def pending_withdrawals(
    admin=Depends(admin_user), db: AsyncSession = Depends(get_db)
):
    rows = (
        await db.execute(
            select(WithdrawalRequest, Transaction, User, Wallet)
            .join(Transaction, WithdrawalRequest.transaction_id == Transaction.id)
            .join(User, WithdrawalRequest.requested_by == User.id)
            .join(Wallet, WithdrawalRequest.wallet_id == Wallet.id)
            .where(WithdrawalRequest.status == WithdrawalStatus.PENDING)
            .order_by(WithdrawalRequest.created_at)
        )
    ).all()
    return [
        {
            "id": str(w.id),
            "reference_number": t.reference_number,
            "email": u.email,
            "wallet_number": wa.wallet_number,
            "amount": w.amount,
            "created_at": w.created_at,
        }
        for w, t, u, wa in rows
    ]


@router.post("/admin/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(
    withdrawal_id: str, admin=Depends(admin_user), db: AsyncSession = Depends(get_db)
):
    await db.rollback()
    async with db.begin():
        wr = await db.get(WithdrawalRequest, withdrawal_id, with_for_update=True)
        if not wr or wr.status != WithdrawalStatus.PENDING:
            raise HTTPException(400, "Withdrawal is not pending")
        tx = await db.get(Transaction, wr.transaction_id, with_for_update=True)
        wallet = await db.get(Wallet, wr.wallet_id, with_for_update=True)
        wa = await get_wallet_account(db, wallet.id)
        cash = await cash_account(db)
        if wallet.status == AccountStatus.FROZEN or wallet.balance < wr.amount:
            raise HTTPException(400, "Withdrawal cannot be approved")
        add_entry(db, tx.id, wa.id, EntryType.DEBIT, wr.amount)
        add_entry(db, tx.id, cash.id, EntryType.CREDIT, wr.amount)
        wallet.balance -= wr.amount
        tx.status = TransactionStatus.COMPLETED
        tx.completed_at = datetime.now(timezone.utc)
        wr.status = WithdrawalStatus.COMPLETED
        wr.reviewed_by = admin.id
        wr.reviewed_at = datetime.now(timezone.utc)
    return {"status": "COMPLETED", "reference_number": tx.reference_number}


@router.post("/admin/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(
    withdrawal_id: str,
    data: WithdrawalDecision,
    admin=Depends(admin_user),
    db: AsyncSession = Depends(get_db),
):
    await db.rollback()
    async with db.begin():
        wr = await db.get(WithdrawalRequest, withdrawal_id, with_for_update=True)
        if not wr or wr.status != WithdrawalStatus.PENDING:
            raise HTTPException(400, "Withdrawal is not pending")
        tx = await db.get(Transaction, wr.transaction_id, with_for_update=True)
        tx.status = TransactionStatus.REJECTED
        wr.status = WithdrawalStatus.REJECTED
        wr.reviewed_by = admin.id
        wr.reviewed_at = datetime.now(timezone.utc)
        wr.rejection_reason = data.rejection_reason
    return {"status": "REJECTED"}


@router.post("/admin/transactions/{transaction_id}/reverse")
async def reverse(
    transaction_id: str, admin=Depends(admin_user), db: AsyncSession = Depends(get_db)
):
    await db.rollback()
    async with db.begin():
        original = await db.get(Transaction, transaction_id, with_for_update=True)
        if not original or original.status != TransactionStatus.COMPLETED:
            raise HTTPException(400, "Only completed transactions can be reversed")
        if original.transaction_type == TransactionType.REVERSAL:
            raise HTTPException(400, "A reversal transaction cannot be reversed")
        if await db.scalar(
            select(Transaction).where(Transaction.reversal_of == original.id)
        ):
            raise HTTPException(409, "Transaction has already been reversed")
        entries = (
            (
                await db.execute(
                    select(LedgerEntry).where(LedgerEntry.transaction_id == original.id)
                )
            )
            .scalars()
            .all()
        )
        wallets = []
        for e in entries:
            a = await db.get(Account, e.account_id)
            if a.wallet_id:
                wallets.append(a.wallet_id)
        for wid in sorted(set(wallets), key=str):
            await db.scalar(select(Wallet).where(Wallet.id == wid).with_for_update())
        rev = Transaction(
            reference_number=ref("REV"),
            transaction_type=TransactionType.REVERSAL,
            status=TransactionStatus.COMPLETED,
            amount=original.amount,
            fee=original.fee,
            total_amount=original.total_amount,
            currency=original.currency,
            note=f"Reversal of {original.reference_number}",
            initiated_by=admin.id,
            reversal_of=original.id,
            completed_at=datetime.now(timezone.utc),
        )
        db.add(rev)
        await db.flush()
        for e in entries:
            opposite = (
                EntryType.CREDIT if e.entry_type == EntryType.DEBIT else EntryType.DEBIT
            )
            add_entry(db, rev.id, e.account_id, opposite, e.amount)
            a = await db.get(Account, e.account_id)
            if a.wallet_id:
                w = await db.get(Wallet, a.wallet_id)
                if opposite == EntryType.CREDIT:
                    w.balance += e.amount
                else:
                    if w.balance < e.amount:
                        raise HTTPException(400, "Reversal would make wallet negative")
                    w.balance -= e.amount
    return {
        "reference_number": rev.reference_number,
        "reversed_transaction": original.reference_number,
    }


@router.get("/admin/transactions")
async def admin_transactions(
    admin=Depends(admin_user), db: AsyncSession = Depends(get_db)
):
    rows = (
        (await db.execute(select(Transaction).order_by(desc(Transaction.created_at))))
        .scalars()
        .all()
    )
    return [
        {
            "id": str(t.id),
            "reference_number": t.reference_number,
            "transaction_type": t.transaction_type.value,
            "status": t.status.value,
            "amount": t.amount,
            "fee": t.fee,
            "total_amount": t.total_amount,
            "created_at": t.created_at,
            "reversal_of": str(t.reversal_of) if t.reversal_of else None,
        }
        for t in rows
    ]


@router.get("/admin/reports/daily-summary")
async def daily_summary(
    admin=Depends(admin_user),
    db: AsyncSession = Depends(get_db),
    date: str | None = Query(default=None),
):
    day = (
        datetime.fromisoformat(date).replace(tzinfo=timezone.utc)
        if date
        else datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
    )
    next_day = day + __import__("datetime").timedelta(days=1)
    rows = (
        (
            await db.execute(
                select(Transaction).where(
                    Transaction.status == TransactionStatus.COMPLETED,
                    Transaction.created_at >= day,
                    Transaction.created_at < next_day,
                )
            )
        )
        .scalars()
        .all()
    )
    return {
        "date": day.date().isoformat(),
        "count": len(rows),
        "volume": sum((t.total_amount for t in rows), Decimal(0)),
        "deposits": sum(
            (t.amount for t in rows if t.transaction_type == TransactionType.DEPOSIT),
            Decimal(0),
        ),
        "withdrawals": sum(
            (
                t.amount
                for t in rows
                if t.transaction_type == TransactionType.WITHDRAWAL
            ),
            Decimal(0),
        ),
        "transfers": sum(
            (t.amount for t in rows if t.transaction_type == TransactionType.TRANSFER),
            Decimal(0),
        ),
        "fees": sum(
            (t.fee for t in rows if t.transaction_type == TransactionType.TRANSFER),
            Decimal(0),
        ),
    }


@router.get("/admin/reports/trial-balance")
async def trial_balance(admin=Depends(admin_user), db: AsyncSession = Depends(get_db)):
    debit = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(
            LedgerEntry.entry_type == EntryType.DEBIT
        )
    ) or Decimal(0)
    credit = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(
            LedgerEntry.entry_type == EntryType.CREDIT
        )
    ) or Decimal(0)
    return {"total_debit": debit, "total_credit": credit, "difference": credit - debit}


@router.get("/admin/reports/reconciliation")
async def reconciliation(admin=Depends(admin_user), db: AsyncSession = Depends(get_db)):
    out = []
    for w in (
        (await db.execute(select(Wallet).order_by(Wallet.wallet_number)))
        .scalars()
        .all()
    ):
        a = await db.scalar(select(Account).where(Account.wallet_id == w.id))
        lb = await ledger_balance(db, a.id) if a else Decimal(0)
        out.append(
            {
                "wallet_number": w.wallet_number,
                "cached_balance": w.balance,
                "ledger_balance": lb,
                "matches": w.balance == lb,
            }
        )
    return out
