from pydantic_settings import BaseSettings, SettingsConfigDict
from decimal import Decimal


class Settings(BaseSettings):
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/wallet_system"
    )
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"
    currency: str = "BDT"
    transfer_fee_fixed: Decimal = Decimal("0.00")
    transfer_fee_percent: Decimal = Decimal("0.00")
    daily_transfer_limit: Decimal = Decimal("100000.00")
    withdrawal_approval_limit: Decimal = Decimal("50000.00")
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
