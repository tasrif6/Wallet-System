"""add password reset fields to users"""

from alembic import op
import sqlalchemy as sa

revision = "0002_add_password_reset_fields"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("reset_code_hash", sa.String(255), nullable=True))
    op.add_column(
        "users",
        sa.Column("reset_code_expires_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_column("users", "reset_code_expires_at")
    op.drop_column("users", "reset_code_hash")
