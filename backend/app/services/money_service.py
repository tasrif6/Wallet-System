from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone, timedelta
import hashlib, json, secrets
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models import *
from app.core.config import settings
from app.services.ledger_service import cash_account, add_entry


def ref(prefix):
    return f"{prefix}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(4).upper()}"


def fee_for(amount: Decimal):
    return (
        settings.transfer_fee_fixed
        + (amount * settings.transfer_fee_percent / Decimal("100"))
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def request_hash(data):
    return hashlib.sha256(
        json.dumps(data, sort_keys=True, default=str).encode()
    ).hexdigest()


async def get_wallet(db, user_id, lock=True):
    q = select(Wallet).where(Wallet.user_id == user_id)
    if lock:
        q = q.with_for_update()
    wallet = await db.scalar(q)
    if not wallet:
        raise HTTPException(404, "Wallet not found")
    return wallet


async def get_wallet_account(db, wallet_id):
    account = await db.scalar(
        select(Account).where(Account.wallet_id == wallet_id).with_for_update()
    )
    if not account:
        raise HTTPException(500, "Wallet ledger account missing")
    return account


async def deposit(db, user, amount):
    wallet = await get_wallet(db, user.id)
    cash = await cash_account(db)
    wa = await get_wallet_account(db, wallet.id)
    if wallet.status == AccountStatus.FROZEN or user.status == AccountStatus.FROZEN:
        raise HTTPException(403, "Account is frozen")
    tx = Transaction(
        reference_number=ref("DEP"),
        transaction_type=TransactionType.DEPOSIT,
        status=TransactionStatus.COMPLETED,
        source_account_id=cash.id,
        destination_account_id=wa.id,
        amount=amount,
        fee=0,
        total_amount=amount,
        currency=settings.currency,
        initiated_by=user.id,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(tx)
    await db.flush()
    add_entry(db, tx.id, cash.id, EntryType.DEBIT, amount)
    add_entry(db, tx.id, wa.id, EntryType.CREDIT, amount)
    wallet.balance += amount
    return tx, wallet


async def withdrawal(db, user, amount, admin_override=False):
    wallet = await get_wallet(db, user.id)
    wa = await get_wallet_account(db, wallet.id)
    cash = await cash_account(db)
    if wallet.status == AccountStatus.FROZEN or user.status == AccountStatus.FROZEN:
        raise HTTPException(403, "Account is frozen")
    if wallet.balance < amount:
        raise HTTPException(400, "Insufficient balance")
    pending = amount > settings.withdrawal_approval_limit and not admin_override
    tx = Transaction(
        reference_number=ref("WDR"),
        transaction_type=TransactionType.WITHDRAWAL,
        status=TransactionStatus.PENDING if pending else TransactionStatus.COMPLETED,
        source_account_id=wa.id,
        destination_account_id=cash.id,
        amount=amount,
        fee=0,
        total_amount=amount,
        currency=settings.currency,
        initiated_by=user.id,
        completed_at=None if pending else datetime.now(timezone.utc),
    )
    db.add(tx)
    await db.flush()
    wr = WithdrawalRequest(
        transaction_id=tx.id,
        wallet_id=wallet.id,
        amount=amount,
        status=WithdrawalStatus.PENDING if pending else WithdrawalStatus.COMPLETED,
        requested_by=user.id,
    )
    db.add(wr)
    if not pending:
        add_entry(db, tx.id, wa.id, EntryType.DEBIT, amount)
        add_entry(db, tx.id, cash.id, EntryType.CREDIT, amount)
        wallet.balance -= amount
    return tx, wallet, wr


async def transfer(db, user, receiver_number, amount, note, idempotency_key):
    if not idempotency_key:
        raise HTTPException(400, "Idempotency-Key header is required")
    data = {
        "receiver_wallet_number": receiver_number,
        "amount": str(amount),
        "note": note,
    }
    rh = request_hash(data)
    existing = await db.scalar(
        select(IdempotencyKey)
        .where(IdempotencyKey.key == idempotency_key)
        .with_for_update()
    )
    if existing:
        if existing.user_id != user.id or existing.request_hash != rh:
            raise HTTPException(
                409, "Idempotency key was already used for a different request"
            )
        tx = await db.get(Transaction, existing.transaction_id)
        wallet = await get_wallet(db, user.id)
        return tx, wallet
    sender = await get_wallet(db, user.id)
    receiver = await db.scalar(
        select(Wallet).where(Wallet.wallet_number == receiver_number)
    )
    if not receiver:
        raise HTTPException(404, "Receiver wallet not found")
    if sender.id == receiver.id:
        raise HTTPException(400, "Self-transfer is not allowed")
    ordered = sorted([sender, receiver], key=lambda w: str(w.id))
    locked1 = await db.scalar(
        select(Wallet).where(Wallet.id == ordered[0].id).with_for_update()
    )
    locked2 = await db.scalar(
        select(Wallet).where(Wallet.id == ordered[1].id).with_for_update()
    )
    sender, receiver = (
        (locked1, locked2) if locked1.user_id == user.id else (locked2, locked1)
    )
    if sender.status == AccountStatus.FROZEN or receiver.status == AccountStatus.FROZEN:
        raise HTTPException(403, "Sender or receiver account is frozen")
    sender_user = await db.get(User, sender.user_id)
    receiver_user = await db.get(User, receiver.user_id)
    if (
        sender_user.status == AccountStatus.FROZEN
        or receiver_user.status == AccountStatus.FROZEN
    ):
        raise HTTPException(403, "Sender or receiver account is frozen")
    fee = fee_for(amount)
    total = amount + fee
    if sender.balance < total:
        raise HTTPException(400, "Insufficient balance including transfer fee")
    start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    transferred = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .join(Account, Transaction.source_account_id == Account.id)
        .where(
            Account.wallet_id == sender.id,
            Transaction.transaction_type == TransactionType.TRANSFER,
            Transaction.status == TransactionStatus.COMPLETED,
            Transaction.created_at >= start,
        )
    ) or Decimal("0")
    if transferred + amount > settings.daily_transfer_limit:
        raise HTTPException(400, "Daily transfer limit exceeded")
    sa = await get_wallet_account(db, sender.id)
    ra = await get_wallet_account(db, receiver.id)
    cash = await cash_account(db)
    tx = Transaction(
        reference_number=ref("TRF"),
        transaction_type=TransactionType.TRANSFER,
        status=TransactionStatus.COMPLETED,
        source_account_id=sa.id,
        destination_account_id=ra.id,
        amount=amount,
        fee=fee,
        total_amount=total,
        currency=settings.currency,
        note=note,
        initiated_by=user.id,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(tx)
    await db.flush()
    add_entry(db, tx.id, sa.id, EntryType.DEBIT, total)
    add_entry(db, tx.id, ra.id, EntryType.CREDIT, amount)
    if fee:
        add_entry(db, tx.id, cash.id, EntryType.CREDIT, fee)
    sender.balance -= total
    receiver.balance += amount
    db.add(
        IdempotencyKey(
            key=idempotency_key,
            user_id=user.id,
            request_type="TRANSFER",
            request_hash=rh,
            transaction_id=tx.id,
        )
    )
    return tx, sender
