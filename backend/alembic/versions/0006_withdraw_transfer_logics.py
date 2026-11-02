"""Add BILL_PAYMENT to the transactiontype enum."""

from alembic import op


revision = "0006_withdrawal_transfer_logics"
down_revision = "0005_activity_log_cols"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'BILL_PAYMENT'")


def downgrade() -> None:
    pass