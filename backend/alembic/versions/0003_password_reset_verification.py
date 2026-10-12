"""track verified password reset codes"""

from alembic import op
import sqlalchemy as sa

revision = "0003_password_reset_verification"
down_revision = "0002_add_password_reset_fields"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "reset_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade():
    op.drop_column("users", "reset_verified")
