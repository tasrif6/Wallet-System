from decimal import Decimal
from uuid import UUID
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


def money(v: Decimal) -> Decimal:
    if v <= 0:
        raise ValueError("Amount must be greater than zero")
    if v.as_tuple().exponent < -2:
        raise ValueError("Amount may have maximum 2 decimal places")
    return v.quantize(Decimal("0.01"))


class RegisterIn(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=6, max_length=128)


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
    new_password: str = Field(min_length=6, max_length=128)
    confirm_password: str = Field(min_length=6, max_length=128)


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


class TransferIn(BaseModel):
    receiver_wallet_number: str = Field(min_length=1, max_length=30)
    amount: Decimal
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


class StatementTransactionOut(TransactionOut):
    debit: Decimal
    credit: Decimal
    running_balance: Decimal


class WithdrawalDecision(BaseModel):
    rejection_reason: str | None = Field(default=None, max_length=500)


class DashboardOut(BaseModel):
    balance: Decimal
    wallet_number: str
    currency: str
    today_count: int
    today_volume: Decimal
    deposits: Decimal
    withdrawals: Decimal
    transfers: Decimal
    fees: Decimal
    pending_withdrawals: int


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
