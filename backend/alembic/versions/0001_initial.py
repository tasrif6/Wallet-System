"""initial wallet ledger schema"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    role = postgresql.ENUM("USER", "ADMIN", name="role", create_type=False)
    role.create(op.get_bind(), checkfirst=True)
    ast = postgresql.ENUM("ACTIVE", "FROZEN", name="accountstatus", create_type=False)
    ast.create(op.get_bind(), checkfirst=True)
    at = postgresql.ENUM(
        "USER_WALLET", "CASH_IN_OUT", name="accounttype", create_type=False
    )
    at.create(op.get_bind(), checkfirst=True)
    tt = postgresql.ENUM(
        "DEPOSIT",
        "WITHDRAWAL",
        "TRANSFER",
        "FEE",
        "REVERSAL",
        name="transactiontype",
        create_type=False,
    )
    tt.create(op.get_bind(), checkfirst=True)
    ts = postgresql.ENUM(
        "PENDING",
        "COMPLETED",
        "REJECTED",
        "REVERSED",
        name="transactionstatus",
        create_type=False,
    )
    ts.create(op.get_bind(), checkfirst=True)
    et = postgresql.ENUM("DEBIT", "CREDIT", name="entrytype", create_type=False)
    et.create(op.get_bind(), checkfirst=True)
    ws = postgresql.ENUM(
        "PENDING",
        "APPROVED",
        "REJECTED",
        "COMPLETED",
        name="withdrawalstatus",
        create_type=False,
    )
    ws.create(op.get_bind(), checkfirst=True)
    op.execute("CREATE SEQUENCE wallet_number_seq START 100001")
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, index=True),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", role, nullable=False),
        sa.Column("status", ast, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_table(
        "wallets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            unique=True,
        ),
        sa.Column("wallet_number", sa.String(30), unique=True, index=True),
        sa.Column("balance", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("status", ast, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.CheckConstraint("balance >= 0", name="wallet_balance_nonnegative"),
    )
    op.create_table(
        "accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("account_type", at, nullable=False),
        sa.Column(
            "wallet_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("wallets.id"),
            unique=True,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("status", ast, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("reference_number", sa.String(50), unique=True, index=True),
        sa.Column("transaction_type", tt, nullable=False),
        sa.Column("status", ts, nullable=False),
        sa.Column(
            "source_account_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("accounts.id"),
        ),
        sa.Column(
            "destination_account_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("accounts.id"),
        ),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("fee", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("note", sa.Text()),
        sa.Column(
            "initiated_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "reversal_of",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("transactions.id"),
            unique=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "ledger_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "transaction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("transactions.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "account_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("accounts.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("entry_type", et, nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_table(
        "withdrawal_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "transaction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("transactions.id"),
            unique=True,
        ),
        sa.Column(
            "wallet_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("wallets.id"),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("status", ws, nullable=False),
        sa.Column(
            "requested_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        sa.Column("rejection_reason", sa.Text()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_table(
        "idempotency_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", sa.String(255), unique=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("request_type", sa.String(50), nullable=False),
        sa.Column("request_hash", sa.String(64), nullable=False),
        sa.Column(
            "transaction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("transactions.id"),
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.execute(
        "CREATE OR REPLACE FUNCTION prevent_completed_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF EXISTS (SELECT 1 FROM transactions t WHERE t.id=OLD.transaction_id AND t.status IN ('COMPLETED','REVERSED')) THEN RAISE EXCEPTION 'Completed ledger entries are immutable'; END IF; RETURN OLD; END; $$"
    )
    op.execute(
        "CREATE TRIGGER ledger_no_update BEFORE UPDATE ON ledger_entries FOR EACH ROW EXECUTE FUNCTION prevent_completed_ledger_mutation()"
    )
    op.execute(
        "CREATE TRIGGER ledger_no_delete BEFORE DELETE ON ledger_entries FOR EACH ROW EXECUTE FUNCTION prevent_completed_ledger_mutation()"
    )
    op.execute(
        "CREATE OR REPLACE FUNCTION ensure_ledger_transaction_balances() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE d numeric; c numeric; BEGIN SELECT COALESCE(SUM(amount) FILTER (WHERE entry_type='DEBIT'),0), COALESCE(SUM(amount) FILTER (WHERE entry_type='CREDIT'),0) INTO d,c FROM ledger_entries WHERE transaction_id=NEW.transaction_id; IF d <> c THEN RAISE EXCEPTION 'Ledger transaction % is not balanced', NEW.transaction_id; END IF; RETURN NULL; END; $$"
    )
    op.execute(
        "CREATE CONSTRAINT TRIGGER ledger_transaction_must_balance AFTER INSERT ON ledger_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_ledger_transaction_balances()"
    )


def downgrade():
    for t in [
        "ledger_entries",
        "idempotency_keys",
        "withdrawal_requests",
        "transactions",
        "accounts",
        "wallets",
        "users",
    ]:
        op.drop_table(t)
    op.execute("DROP SEQUENCE IF EXISTS wallet_number_seq")
    for typ in [
        "withdrawalstatus",
        "entrytype",
        "transactionstatus",
        "transactiontype",
        "accounttype",
        "accountstatus",
        "role",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {typ}")
