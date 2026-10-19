
"""add_admin_activity_logs"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Revision identifiers
revision = "0004_admin_activity_logs"
down_revision = "0003_password_reset_verification"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the admin activity history table.
    op.create_table(
        "admin_activity_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("admin_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("target_type", sa.String(length=50), nullable=False),
        sa.Column("target_id", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["admin_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("admin_activity_logs")
