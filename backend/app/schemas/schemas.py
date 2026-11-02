from decimal import Decimal
from uuid import UUID
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)
import re

def strong_password(value: str) -> str:
    missing = []
    if len(value) < 8:
        missing.append("at least 8 characters")
    if not re.search(r"[a-z]", value):
        missing.append("a lowercase letter")
    if not re.search(r"[A-Z]", value):
        missing.append("an uppercase letter")
    if not re.search(r"\d", value):
        missing.append("a number")
    if not re.search(r"[^A-Za-z0-9]", value):
        missing.append("a special character (such as @, # or !)")
    if missing:
        raise ValueError("Password must contain " + ", ".join(missing))
    return value

def money(v: Decimal) -> Decimal:
    if v <= 0:
        raise ValueError("Amount must be greater than zero")
    if v.as_tuple().exponent < -2:
        raise ValueError("Amount may have maximum 2 decimal places")
    return v.quantize(Decimal("0.01"))


class RegisterIn(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def check_password_strength(cls, v):
        return strong_password(v)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordOut(BaseModel):
    exists: bool
    message: str

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, v):
        return strong_password(v)

class PasswordResetOut(BaseModel):
    message: str


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    status: str
    model_config = ConfigDict(from_attributes=True)


class WalletOut(BaseModel):
    wallet_number: str
    balance: Decimal
    currency: str
    status: str
    model_config = ConfigDict(from_attributes=True)


class AmountIn(BaseModel):
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        return money(v)


class PasswordAmountIn(AmountIn):
    password: str = Field(min_length=1, max_length=128)


class BillPaymentIn(PasswordAmountIn):
    biller_id: str = Field(min_length=3, max_length=50)
    account_number: str = Field(min_length=5, max_length=30)

    @field_validator("account_number")
    @classmethod
    def check_account_number(cls, v):
        v = v.strip()
        if len(v) < 3 or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9 /-]*", v):
            raise ValueError(
                "Enter a valid number (letters, digits, spaces, - and / only)"
            )
        return v

class BillPaymentOut(BaseModel):
    reference_number: str
    biller: str
    account_number: str
    amount: Decimal
    fee: Decimal
    total_amount: Decimal
    status: str
    balance: Decimal

class DepositOut(BaseModel):
    reference_number: str
    amount: Decimal
    balance: Decimal
    status: str


class WithdrawalOut(BaseModel):
    reference_number: str
    amount: Decimal
    status: str
    balance: Decimal
    fee: Decimal = Decimal("0.00")
    total_amount: Decimal | None = None
    message: str | None = None


class TransferIn(BaseModel):
    receiver_wallet_number: str = Field(min_length=1, max_length=30)
    amount: Decimal
    password: str = Field(min_length=1, max_length=128)
    note: str | None = Field(default=None, max_length=500)

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        return money(v)


class ReceiverOut(BaseModel):
    wallet_number: str
    full_name: str


class TransactionOut(BaseModel):
    reference_number: str
    transaction_type: str
    status: str
    amount: Decimal
    fee: Decimal
    total_amount: Decimal
    note: str | None
    created_at: object
    message: str | None = None


class StatementTransactionOut(TransactionOut):
    debit: Decimal
    credit: Decimal
    balance: Decimal


class WithdrawalDecision(BaseModel):
    rejection_reason: str | None = Field(default=None, max_length=500)


class DashboardOut(BaseModel):
    balance: Decimal
    wallet_number: str
    currency: str
    status: str
    today_count: int
    today_volume: Decimal
    deposits: Decimal
    withdrawals: Decimal
    transfers: Decimal
    fees: Decimal
    pending_withdrawals: int
    withdrawal_fee_per_1000: Decimal = Decimal("0")
    transfer_fee: Decimal = Decimal("0")
    minimum_balance: Decimal = Decimal("0")
    approval_percentage: Decimal = Decimal("0")


class AdminDashboardOut(BaseModel):
    active_accounts: int
    frozen_accounts: int
    pending_withdrawals: int
    today_count: int
    today_volume: Decimal
    deposits: Decimal
    withdrawals: Decimal
    transfers: Decimal
    fees: Decimal
    total_money_in_system: Decimal
    ledger_total: Decimal
    reconciliation_mismatches: int
