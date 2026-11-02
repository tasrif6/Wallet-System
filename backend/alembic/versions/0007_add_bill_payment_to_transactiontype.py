from alembic import op

revision = "0007_add_bill_payment"   
down_revision = "0006_withdrawal_transfer_logics"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'BILL_PAYMENT'")


def downgrade() -> None:
    pass