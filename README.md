# Wallet / Ledger System

Internal wallet application built according to the supplied Wallet / Ledger System task.

## Architecture

```text
React.js
   |
   | HTTP/JSON
   v
FastAPI
   |
   | SQLAlchemy + PostgreSQL transactions
   v
Local PostgreSQL
```

### Financial authority
- React never writes directly to PostgreSQL.
- FastAPI owns all financial business rules.
- PostgreSQL provides atomic transactions, row locks, constraints, and persistence.
- `ledger_entries` are the permanent financial record.
- `wallets.balance` is a cached balance and is updated only inside the same DB transaction that creates ledger entries.

## Included task features

- User registration/login, User/Admin roles, one wallet per user, unique WAL wallet numbers.
- Freeze/unfreeze accounts.
- Wallets need a minimum balance of 1,000 Tk to remain active. Withdrawals at or above 90% of the current balance, or that would use this reserve, require admin approval. An approved withdrawal below the minimum freezes the wallet. Deposits remain allowed, and an admin can unfreeze it after the minimum balance is restored.
- Deposit with Cash In/Out system account.
- Immediate and approval-required withdrawals.
- Receiver lookup and transfer confirmation.
- Transfer fee and daily transfer limit are configurable.
- Idempotency-Key handling for transfers.
- PostgreSQL row locking for transfers and wallet operations.
- Double-entry ledger and transaction atomicity.
- Immutable completed ledger entries through a database trigger.
- Non-negative cached wallet balance constraint.
- Transaction history with debit/credit/running balance and filters.
- Admin dashboard, account management, pending withdrawals, all transactions.
- Reversal with a new linked reversal transaction and double-reversal prevention.
- Trial balance, daily summary, and reconciliation endpoints.

## Business configuration

<<<<<<< HEAD
The repository-root `.env` configures transfer fees, daily transfer limits, the withdrawal approval percentage, minimum account balance, and currency. The backend loads these values from that file; it is shared by the backend and frontend development server.
=======
The task file does not specify exact values for transfer fees, daily transfer limits, withdrawal approval threshold, or currency. These are environment configuration values in the repository-root `.env`, which is shared by the backend and frontend development server.
>>>>>>> ed6507eac0c31efb2a395df95287612163cde8b0

## Setup

### 1. PostgreSQL
Create a local database named `wallet_system`.

### 2. Backend
```powershell
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### 3. Frontend
```powershell
cd frontend
npm install
npm run dev
```

The backend loads settings from the repository-root `.env` regardless of the working directory. Vite also reads that file; set `VITE_API_URL` there to override the default backend URL (`http://localhost:8000`).

Open the Vite URL shown in the terminal, normally http://localhost:5173.

For password recovery, submit the account email on the Forgot Password page and retrieve the six-digit reset code from the backend terminal. Verify it within two minutes, then set and confirm the new password; successful changes return to sign-in.

Change the local development credentials before using the project outside local development.

## Scope note

Testing is intentionally not included yet, per the project decision. The task's testing cases remain the target cases for the later testing phase.
