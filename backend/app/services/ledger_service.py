from decimal import Decimal
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Account, AccountType, EntryType, LedgerEntry, Transaction
from app.core.config import settings


async def cash_account(db: AsyncSession) -> Account:
    account = await db.scalar(
        select(Account)
        .where(Account.account_type == AccountType.CASH_IN_OUT)
        .with_for_update()
    )
    if not account:
        account = Account(
            account_type=AccountType.CASH_IN_OUT,
            name="Cash In/Out",
            currency=settings.currency,
        )
        db.add(account)
        await db.flush()
    return account


def add_entry(db, transaction_id, account_id, entry_type, amount):
    db.add(
        LedgerEntry(
            transaction_id=transaction_id,
            account_id=account_id,
            entry_type=entry_type,
            amount=amount,
            currency=settings.currency,
        )
    )


async def ledger_balance(db: AsyncSession, account_id):
    debit = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(
            LedgerEntry.account_id == account_id,
            LedgerEntry.entry_type == EntryType.DEBIT,
        )
    )
    credit = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(
            LedgerEntry.account_id == account_id,
            LedgerEntry.entry_type == EntryType.CREDIT,
        )
    )
    return (credit or Decimal("0")) - (debit or Decimal("0"))


async def transaction_ledger_total(db: AsyncSession, transaction_id):
    debit = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(
            LedgerEntry.transaction_id == transaction_id,
            LedgerEntry.entry_type == EntryType.DEBIT,
        )
    )
    credit = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), 0)).where(
            LedgerEntry.transaction_id == transaction_id,
            LedgerEntry.entry_type == EntryType.CREDIT,
        )
    )
    return (credit or Decimal("0")) - (debit or Decimal("0"))
