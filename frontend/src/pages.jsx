import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, auth } from "./services/api";
import { useAuth } from "./context/AuthContext";

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100";
const primary =
  "inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";
const secondary =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

function PageTitle({ title, description, children }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
function Card({ title, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
function AuthBox({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white font-bold text-slate-950">
            W
          </div>
          <h1 className="text-2xl font-bold">Wallet Ledger</h1>
          <p className="mt-1 text-sm text-slate-400">Secure Wallet System</p>
        </div>
        <div className="rounded-3xl bg-white p-7 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
          {children}
          {footer && (
            <div className="mt-5 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function Error({ children }) {
  return children ? (
    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </p>
  ) : null;
}
function Table({ rows, cols }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {cols.map((c) => (
              <th key={c} className="whitespace-nowrap px-5 py-3 font-semibold">
                {c.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="hover:bg-slate-50">
              {cols.map((c) => (
                <td
                  key={c}
                  className="whitespace-nowrap px-5 py-4 text-slate-700"
                >
                  {String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="p-8 text-center text-sm text-slate-400">
          No records found.
        </div>
      )}
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [e, setE] = useState(""),
    [p, setP] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [err, setErr] = useState("");
  return (
    <AuthBox
      title="Welcome back"
      subtitle="Sign in to your wallet"
      footer={
        <>
          New here?{" "}
          <Link className="font-semibold text-slate-950" to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={async (x) => {
          x.preventDefault();
          try {
            await login({ email: e, password: p });
            nav("/dashboard");
          } catch (z) {
            setErr(z.message);
          }
        }}
      >
        <input
          className={input}
          placeholder="Email"
          value={e}
          onChange={(x) => setE(x.target.value)}
          required
        />


        <div className = "relative">
            <input
            className={input}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={p}
            onChange={(x) => setP(x.target.value)}
            required
            />
            <button type = "button" onClick={() => setShowPassword((prev) => !prev)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-950">
                    {showPassword ? "Hide" : "Show"}
            </button>
        </div>

        <Error>{err}</Error>
        <button className={`${primary} w-full`} type="submit">
          Login
        </button>
        <div className = "text=right">
            <Link to="/forgot-password"
            className="text-sm font-semibold text-slate-600 hover:text-slate-950">Forgot Password?</Link>
        </div>
      </form>
    </AuthBox>
  );
}

export function ForgotPassword () {
    const [email, setEmail]= useState("");
    const [message, setMessage] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState("");

    return (
        <AuthBox
            title="Forgot your password?"
            subtitle ="Enter your email to reset your password"
            footer= {
              <>
                New here?{" "}
                <Link className="font-semibold text-slate-950" to="/register">
                  Create an account
                </Link>
              </>
            }>
            <form className="mt-6 space-y-4"
                onSubmit={async (x) => {
                    x.preventDefault();
                    setErr("");
                    setMessage("");
                    setLoading(true);

                    try {
                        
                        const data = await auth.forgot_password({ email: email.trim() });
                        if (data.exists === false) {
                          setErr("No Account matched with this email address");
                          return;
                        }
                
                        setMessage(data.message)
                        return;
                    } catch (err){
                        setErr(err.message)
                    } finally {
                      setLoading(false)
                    }
                }}>


                <input 
                    className={input}
                    type="email"
                    placeholder="Enter your Email" 
                    value={email}
                    onChange={(x) => setEmail(x.target.value)}
                    required />

                {message && (<p className="text-sm text=green-700">{message}</p>)}
                <Error>{err}</Error>
                <button className={`${primary} w-full`}
                    type="submit"
                    disabled={loading}> {loading ? "Sending..." : "Send Reset Code"}
                </button>
            </form>
        </AuthBox>

    )
}

export function ResetPassword() {
  const nav = useNavigate();
  const [e, setE] = useState(""),
    [r, setR] = useState(""),
    [p, setP] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [err, setErr] = useState("");
  return (
    <AuthBox
      title="Reset Your Password"
      subtitle="Secure your account by updating with the new password"
      footer={
        <>
          Password Changed?{" "}
          <Link className="font-semibold text-slate-950" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={async (x) => {
          x.preventDefault();
          try {
            const r = await auth.reset_password({
              email: e,
              reset_code: r,
              password: p,
            });
            localStorage.setItem("token", r.access_token);
            nav("/dashboard");
          } catch (err) {
            setErr(err.message);
          }
        }}
      >
        <input
          className={input}
          type="email"
          placeholder="Email"
          value={e}
          onChange={(x) => setE(x.target.value)}
          required
        />
        <input
          className={input}
          placeholder="Please enter your reset code"
          value={n}
          onChange={(x) => setN(x.target.value)}
          required
        />
        <div className = "relative">
            <input
            className={input}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={p}
            onChange={(x) => setP(x.target.value)}
            required
            />
            <button type = "button" onClick={() => setShowPassword((prev) => !prev)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-950">
                    {showPassword ? "Hide" : "Show"}
            </button>
        </div>
        <Error>{err}</Error>
        <button className={`${primary} w-full`} type="submit">
          Submit
        </button>
      </form>
    </AuthBox>
  );
}
export function Register() {
  const nav = useNavigate();
  const [e, setE] = useState(""),
    [n, setN] = useState(""),
    [p, setP] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [err, setErr] = useState("");
  return (
    <AuthBox
      title="Create your wallet"
      subtitle="Register a new user account"
      footer={
        <>
          Already registered?{" "}
          <Link className="font-semibold text-slate-950" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={async (x) => {
          x.preventDefault();
          try {
            const r = await auth.register({
              email: e,
              full_name: n,
              password: p,
            });
            localStorage.setItem("token", r.access_token);
            nav("/dashboard");
          } catch (err) {
            setErr(err.message);
          }
        }}
      >
        <input
          className={input}
          placeholder="Full name"
          value={n}
          onChange={(x) => setN(x.target.value)}
          required
        />
        <input
          className={input}
          type="email"
          placeholder="Email"
          value={e}
          onChange={(x) => setE(x.target.value)}
          required
        />
        <div className = "relative">
            <input
            className={input}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={p}
            onChange={(x) => setP(x.target.value)}
            required
            />
            <button type = "button" onClick={() => setShowPassword((prev) => !prev)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-950">
                    {showPassword ? "Hide" : "Show"}
            </button>
        </div>
        <Error>{err}</Error>
        <button className={`${primary} w-full`} type="submit">
          Create account
        </button>
      </form>
    </AuthBox>
  );
}

export function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => {
    api("/dashboard").then(setD);
  }, []);
  if (!d)
    return (
      <div className="py-20 text-center text-slate-500">
        Loading dashboard...
      </div>
    );
  return (
    <>
      <PageTitle title="Dashboard" description="Your wallet at a glance">
        <div className="flex gap-2">
          <Link className={secondary} to="/transactions">
            View history
          </Link>
          <Link className={primary} to="/transfer">
            Transfer money
          </Link>
        </div>
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Available balance" value={`${d.balance} ${d.currency}`} />
        <Card title="Wallet number" value={d.wallet_number} />
        <Card title="Today volume" value={`${d.today_volume} ${d.currency}`} />
        <Card title="Today transactions" value={d.today_count} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="font-bold">Money movement</h2>
          <p className="mt-1 text-sm text-slate-500">
            All changes are processed through the backend ledger.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link className={`${secondary} text-center`} to="/deposit">
              Deposit
            </Link>
            <Link className={`${secondary} text-center`} to="/withdrawal">
              Withdraw
            </Link>
            <Link className={`${primary} text-center`} to="/transfer">
              Transfer
            </Link>
          </div>
        </div>
        <Card
          title="Pending withdrawals"
          value={d.pending_withdrawals}
          hint="Waiting for admin approval"
        />
      </div>
    </>
  );
}

function MoneyForm({ type }) {
  const [amount, setAmount] = useState(""),
    [msg, setMsg] = useState(""),
    [err, setErr] = useState("");
  return (
    <div className="mx-auto max-w-xl">
      <PageTitle
        title={type}
        description={
          type === "Deposit"
            ? "Add money through the system cash account."
            : "Withdraw money from your wallet."
        }
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="text-sm font-semibold text-slate-700">Amount</label>
        <input
          className={`${input} mt-2`}
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="mt-4">
          <button
            className={primary}
            onClick={async () => {
              try {
                const r = await api(
                  type === "Deposit" ? "/deposits" : "/withdrawals",
                  { method: "POST", body: JSON.stringify({ amount }) },
                );
                setMsg(
                  `${r.reference_number} — ${r.status} — balance ${r.balance ?? "unchanged"}`,
                );
                setErr("");
              } catch (e) {
                setErr(e.message);
              }
            }}
          >
            {type}
          </button>
        </div>
        <Error>{err}</Error>
        {msg && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
export function Deposit() {
  return <MoneyForm type="Deposit" />;
}
export function Withdrawal() {
  return <MoneyForm type="Withdrawal" />;
}

export function Transfer() {
  const [r, setR] = useState(""),
    [a, setA] = useState(""),
    [n, setN] = useState(""),
    [receiver, setReceiver] = useState(null),
    [msg, setMsg] = useState(""),
    [err, setErr] = useState("");
  return (
    <div className="mx-auto max-w-xl">
      <PageTitle
        title="Transfer money"
        description="Confirm the recipient before sending money."
      />
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            Receiver wallet number
          </label>
          <div className="mt-2 flex gap-2">
            <input
              className={input}
              placeholder="WAL-100001"
              value={r}
              onChange={(e) => setR(e.target.value)}
            />
            <button
              className={secondary}
              onClick={async () => {
                try {
                  setReceiver(await api(`/transfers/${r}/receiver`));
                  setErr("");
                } catch (e) {
                  setErr(e.message);
                }
              }}
            >
              Find
            </button>
          </div>
        </div>
        {receiver && (
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recipient
            </p>
            <p className="mt-1 font-bold text-slate-950">
              {receiver.full_name}
            </p>
            <p className="text-sm text-slate-500">{receiver.wallet_number}</p>
          </div>
        )}
        <div>
          <label className="text-sm font-semibold text-slate-700">Amount</label>
          <input
            className={`${input} mt-2`}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">
            Note <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            className={`${input} mt-2`}
            placeholder="Payment note"
            value={n}
            onChange={(e) => setN(e.target.value)}
          />
        </div>
        <Error>{err}</Error>
        {receiver && (
          <button
            className={primary}
            onClick={async () => {
              try {
                const key = crypto.randomUUID();
                const x = await api("/transfers", {
                  method: "POST",
                  headers: { "Idempotency-Key": key },
                  body: JSON.stringify({
                    receiver_wallet_number: r,
                    amount: a,
                    note: n || null,
                  }),
                });
                setMsg(`${x.reference_number} completed; fee ${x.fee}`);
                setErr("");
              } catch (e) {
                setErr(e.message);
              }
            }}
          >
            Confirm Transfer
          </button>
        )}
        {msg && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

export function Transactions() {
  const [t, setT] = useState([]),
    [type, setType] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const load = () => {
    const q = new URLSearchParams();
    if (type) q.set("transaction_type", type);
    if (start) q.set("start_date", start);
    if (end) q.set("end_date", end);
    api("/transactions?" + q).then(setT);
  };
  useEffect(load, []);
  return (
    <>
      <PageTitle
        title="Transaction history"
        description="Your wallet statement, newest transactions first."
      />
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
        <input
          className={input}
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          className={input}
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        <select
          className={input}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All types</option>
          <option>DEPOSIT</option>
          <option>WITHDRAWAL</option>
          <option>TRANSFER</option>
          <option>REVERSAL</option>
        </select>
        <button className={primary} onClick={load}>
          Filter
        </button>
      </div>
      <Table
        rows={t}
        cols={[
          "reference_number",
          "transaction_type",
          "status",
          "debit",
          "credit",
          "running_balance",
          "created_at",
        ]}
      />
    </>
  );
}

export function AdminDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => {
    api("/admin/dashboard").then(setD);
  }, []);
  if (!d)
    return (
      <div className="py-20 text-center text-slate-500">
        Loading admin dashboard...
      </div>
    );
  return (
    <>
      <PageTitle
        title="Admin dashboard"
        description="System-wide wallet, ledger and reconciliation overview"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(d).map(([k, v]) => (
          <Card key={k} title={k.replaceAll("_", " ")} value={String(v)} />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className={secondary} to="/admin/users">
          Accounts
        </Link>
        <Link className={secondary} to="/admin/withdrawals">
          Pending withdrawals
        </Link>
        <Link className={primary} to="/admin/transactions">
          Transactions / reversal
        </Link>
      </div>
    </>
  );
}
export function AdminUsers() {
  const [rows, setRows] = useState([]);
  const load = () => api("/admin/users").then(setRows);
  useEffect(load, []);
  return (
    <>
      <PageTitle
        title="Accounts"
        description="View balances and freeze or unfreeze accounts."
      />
      <Table
        rows={rows.map((r) => ({
          ...r,
          action: <button className={secondary}>Manage</button>,
        }))}
        cols={["wallet_number", "full_name", "email", "balance", "status"]}
      />
      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"
              >
                <span className="text-sm font-semibold">
                  {r.wallet_number} · {r.full_name}
                </span>
                <button
                  className={secondary}
                  onClick={async () => {
                    await api(
                      `/admin/users/${r.id}/${r.status === "ACTIVE" ? "freeze" : "unfreeze"}`,
                      { method: "POST" },
                    );
                    load();
                  }}
                >
                  {r.status === "ACTIVE" ? "Freeze" : "Unfreeze"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
export function AdminWithdrawals() {
  const [rows, setRows] = useState([]);
  const load = () => api("/admin/withdrawals/pending").then(setRows);
  useEffect(load, []);
  return (
    <>
      <PageTitle
        title="Pending withdrawals"
        description="Approve or reject withdrawals above the configured approval threshold."
      />
      <Table
        rows={rows}
        cols={["reference_number", "wallet_number", "amount", "status"]}
      />
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold">{r.reference_number}</p>
              <p className="text-sm text-slate-500">
                {r.wallet_number} · {r.amount}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className={primary}
                onClick={async () => {
                  await api(`/admin/withdrawals/${r.id}/approve`, {
                    method: "POST",
                  });
                  load();
                }}
              >
                Approve
              </button>
              <button
                className={secondary}
                onClick={async () => {
                  await api(`/admin/withdrawals/${r.id}/reject`, {
                    method: "POST",
                    body: JSON.stringify({
                      rejection_reason: "Rejected by admin",
                    }),
                  });
                  load();
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
export function AdminTransactions() {
  const [rows, setRows] = useState([]);
  const load = () => api("/admin/transactions").then(setRows);
  useEffect(load, []);
  return (
    <>
      <PageTitle
        title="All transactions"
        description="Review completed transactions and create reversals."
      />
      <Table
        rows={rows}
        cols={[
          "reference_number",
          "transaction_type",
          "status",
          "amount",
          "fee",
        ]}
      />
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold">{r.reference_number}</p>
              <p className="text-sm text-slate-500">
                {r.transaction_type} · {r.status} · {r.amount}
              </p>
            </div>
            {r.status === "COMPLETED" && (
              <button
                className={secondary}
                onClick={async () => {
                  if (confirm(`Reverse ${r.reference_number}?`)) {
                    try {
                      await api(`/admin/transactions/${r.id}/reverse`, {
                        method: "POST",
                      });
                      load();
                    } catch (e) {
                      alert(e.message);
                    }
                  }
                }}
              >
                Reverse
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
