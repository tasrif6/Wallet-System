from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from decimal import Decimal

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    cors_origins: str
    currency: str
    transfer_fee_fixed: Decimal
    transfer_fee_percent: Decimal
    daily_transfer_limit: Decimal
    withdrawal_approval_percentage: Decimal = Field(ge=0, le=100)
    minimum_account_balance: Decimal = Field(ge=0)
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        extra="ignore",
    )


settings = Settings()
