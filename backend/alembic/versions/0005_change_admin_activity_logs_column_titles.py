"""Align admin activity logs with the current model."""

from alembic import op
import sqlalchemy as sa


revision = "0005_activity_log_cols"
down_revision = "0004_admin_activity_logs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "admin_activity_logs",
        sa.Column("wallet_number", sa.String(length=30), nullable=True),
    )
    op.add_column(
        "admin_activity_logs",
        sa.Column("users_name", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "admin_activity_logs",
        sa.Column("users_email", sa.String(length=100), nullable=True),
    )

    op.execute(
        sa.text(
            """
            WITH resolved AS (
                SELECT
                    log.id AS log_id,
                    wallet.wallet_number,
                    user_record.full_name AS users_name,
                    user_record.email AS users_email
                FROM admin_activity_logs AS log
                JOIN users AS user_record
                    ON user_record.id::text = log.target_id
                JOIN wallets AS wallet
                    ON wallet.user_id = user_record.id
                WHERE log.target_type = 'USER'

                UNION ALL

                SELECT
                    log.id AS log_id,
                    wallet.wallet_number,
                    user_record.full_name AS users_name,
                    user_record.email AS users_email
                FROM admin_activity_logs AS log
                JOIN withdrawal_requests AS withdrawal
                    ON withdrawal.id::text = log.target_id
                JOIN wallets AS wallet
                    ON wallet.id = withdrawal.wallet_id
                JOIN users AS user_record
                    ON user_record.id = wallet.user_id
                WHERE log.target_type = 'WITHDRAWAL'

                UNION ALL

                SELECT
                    log.id AS log_id,
                    wallet.wallet_number,
                    user_record.full_name AS users_name,
                    user_record.email AS users_email
                FROM admin_activity_logs AS log
                JOIN transactions AS transaction_record
                    ON transaction_record.id::text = log.target_id
                JOIN accounts AS source_account
                    ON source_account.id = transaction_record.source_account_id
                LEFT JOIN wallets AS source_wallet
                    ON source_wallet.id = source_account.wallet_id
                JOIN accounts AS destination_account
                    ON destination_account.id = transaction_record.destination_account_id
                LEFT JOIN wallets AS destination_wallet
                    ON destination_wallet.id = destination_account.wallet_id
                JOIN wallets AS wallet
                    ON wallet.id = COALESCE(source_wallet.id, destination_wallet.id)
                JOIN users AS user_record
                    ON user_record.id = wallet.user_id
                WHERE log.target_type = 'TRANSACTION'
            )
            UPDATE admin_activity_logs AS log
            SET wallet_number = resolved.wallet_number,
                users_name = resolved.users_name,
                users_email = resolved.users_email
            FROM resolved
            WHERE log.id = resolved.log_id
            """
        )
    )
    op.execute(
        sa.text(
            """
            DO $$
            DECLARE
                unresolved_ids text;
            BEGIN
                SELECT string_agg(id::text, ', ' ORDER BY id)
                INTO unresolved_ids
                FROM admin_activity_logs
                WHERE wallet_number IS NULL;

                IF unresolved_ids IS NOT NULL THEN
                    RAISE EXCEPTION
                        'Cannot migrate admin activity logs; affected wallets were not found for log IDs: %',
                        unresolved_ids;
                END IF;
            END $$;
            """
        )
    )

    op.alter_column(
        "admin_activity_logs",
        "wallet_number",
        existing_type=sa.String(length=30),
        nullable=False,
    )
    op.create_foreign_key(
        "fk_admin_activity_logs_wallet_number_wallets",
        "admin_activity_logs",
        "wallets",
        ["wallet_number"],
        ["wallet_number"],
    )
    op.drop_column("admin_activity_logs", "target_id")
    op.drop_column("admin_activity_logs", "details")


def downgrade() -> None:
    op.add_column(
        "admin_activity_logs",
        sa.Column("target_id", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "admin_activity_logs",
        sa.Column("details", sa.JSON(), nullable=True),
    )
    op.drop_constraint(
        "fk_admin_activity_logs_wallet_number_wallets",
        "admin_activity_logs",
        type_="foreignkey",
    )
    op.drop_column("admin_activity_logs", "users_email")
    op.drop_column("admin_activity_logs", "users_name")
    op.drop_column("admin_activity_logs", "wallet_number")
