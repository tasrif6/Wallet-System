import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, auth } from "./services/api";
import { useAuth } from "./context/AuthContext";
import { IoIosArrowBack } from "react-icons/io";
import { toast } from "sonner";
import { TriangleAlert, Eye, EyeClosed, CircleAlert, Download } from "lucide-react";
import PasswordConfirm from "@/components/PasswordConfirm";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import PasswordStrength, { isStrongPassword } from "@/components/PasswordStrength";
import { downloadTablePdf } from "./lib/pdf";
import { usePdfPassword } from "./lib/usePdfPassword";

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100";
const primary =
  "inline-flex items-center justify-center border rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-blue-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";
const secondary =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-700 hover:text-white";

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
function Card({ title, value, hint, href, className="" }) {
  const navigate = useNavigate();
  const go = () => href && navigate(href);
  return (
    <div
      onClick={go}
      onKeyDown={(e) => e.key === "Enter" && go()}
      role={href ? "link" : undefined}
      tabIndex={href ? 0 : undefined}
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        href ? "cursor-pointer hover:shadow-md transition" : ""
      } ${className}`}
      >      
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
function Table({ rows, cols, centeredCols = [] }) {
  const centered = new Set(centeredCols);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                className={`whitespace-nowrap px-5 py-3 font-semibold ${
                  centered.has(c) ? "text-center" : ""
                }`}
              >
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
                  className={`whitespace-nowrap px-5 py-4 text-slate-700 ${
                    centered.has(c) ? "text-center" : ""
                  }`}
                >
                  {r[c] ?? ""}
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

function Pager({ page, pageSize, total, onPage, loading = false }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <span>
        {total === 0
          ? "No records"
          : `Showing ${(page - 1) * pageSize + 1}–${Math.min(
              page * pageSize,
              total,
            )} of ${total}`}
      </span>
      <div className="flex items-center gap-2">
        <button
          className={secondary}
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          className={secondary}
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Client-side paginated table. Pass resetKey (e.g. the search text) to jump back to page 1.
function PagedTable({ rows, cols, centeredCols = [], pageSize = 10, resetKey }) {
  const [page, setPage] = useState(1);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    setPage(1);
  }, [resetKey]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const start = (page - 1) * pageSize;
  return (
    <>
      <Table
        rows={rows.slice(start, start + pageSize)}
        cols={cols}
        centeredCols={centeredCols}
      />
      <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} />
    </>
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
             <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 dark:hover:text-slate-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
              </button>
        </div>

        <Error>{err}</Error>
        <button className={`${primary} w-full text-xl`} type="submit">
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
    const nav = useNavigate();
    const [email, setEmail]= useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

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
                    setLoading(true);

                    try {
                        const data = await auth.forgot_password({ email: email.trim() });
                        if (data.exists === false) {
                          setErr("No Account matched with this email address");
                          return;
                        }
                        nav("/verify-otp", {
                          state: { email: email.trim(), message: data.message },
                        });
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

                <Error>{err}</Error>
                <button className={`${primary} w-full`}
                    type="submit"
                    disabled={loading}> {loading ? "Sending..." : "Send Reset Code"}
                </button>
            </form>
        </AuthBox>

    )
}

export function VerifyPassword(){
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    if (!email.trim()){
      setErr("Enter your email first");
      return;
    } 
    setErr("")
    setInfo("")
    setLoading(true);

    try {
      const data = await auth.forgot_password({email: email.trim() });
      if (data.exists === false) {
        setErr("No Account matched with this email address");
      } else {
        setCode("");
        setInfo(data.message);
      }
    } catch (err) {
      setErr(err.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <AuthBox
      title="Verify Your One Time Code (OTP)"
      subtitle="Enter the six-digit code printed in the backend terminal. It expires in 2 minutes."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setErr("");
          setLoading(true);
          try {
            await auth.verify_reset_code({ email: email.trim(), code });
            nav("/reset-password", { state: { email: email.trim() } });
          } catch (error) {
            setErr(error.message);
          } finally {
            setLoading(false);
          }
        }}
      >
        { location.state?.message && (
          <p className="text-sm text-green-700">{location.state.message}</p>
        )}
        {info && <p className="text-sm text-green-700">{info}</p>}

        <input
          className={input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className={input}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Six-digit verification code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          pattern="[0-9]{6}"
          maxLength={6}
          required
        />
        <Error>{err}</Error>
        <button className={`${primary} w-full`} type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify code"}
        </button>
      </form>
    </AuthBox>
  )
}

export function ResetPassword() {
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [err, setErr] = useState(location.state?.error ?? "");  
  const [loading, setLoading] = useState(false);
  
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
        onSubmit={async (event) => {
          event.preventDefault();
          setErr("");
          if (newPassword !== confirmPassword) {
            setErr("Passwords do not match, please check!");
            return;
          }
          setLoading(true);
          try {
            await auth.reset_password({
              email: email.trim(),
              new_password: newPassword,
              confirm_password: confirmPassword,
            });
            nav("/login", {replace: true});
          } catch (err) {
            if (err.code === "RESET_EXPIRED") {
              nav("/verify-otp", {
                replace: true,
                state: { email: email.trim(), error: err.message },
              });
              return;
            }
            setErr(err.message);
          } finally {
            setLoading(false);
          }
        }}
      >
        <input
          className={input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          readOnly={Boolean(location.state?.email)}
          required
        />

        <div className = "relative">
            <input
              className={input}
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
            {/* <button type = "button" onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-950">
                    {showNewPassword ? "Hide" : "Show"}
            </button> */}

            <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 dark:hover:text-slate-200"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                title={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
              </button>
        </div>

        <div className = "relative">
            <input
              className={input}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
            {/* <button type = "button" onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-950">
                    {showConfirmPassword ? "Hide" : "Show"}
            </button> */}
            <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 dark:hover:text-slate-200"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
              </button>
        </div>
        
        <PasswordStrength password={newPassword} />
        
        <Error>{err}</Error>
        <button className={`${primary} w-full`} type="submit" disabled={loading || !isStrongPassword(newPassword)}>
          {loading ? "Updating password..." : "Submit"}
        </button>
      </form>
    </AuthBox>
  );
}
export function Register() {
  const { startSession } = useAuth();
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
            await startSession(r.access_token, p);
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
            minLength={8}
            max_length={128}
            onChange={(x) => setP(x.target.value)}
            required
            />
            <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 dark:hover:text-slate-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
            </button>
        </div>
        <PasswordStrength password={p} />
        <Error>{err}</Error>
        <button className={`${primary} w-full`} type="submit" disabled={!isStrongPassword}>
          Create account
        </button>
      </form>
    </AuthBox>
  );
}

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function getActivityBuckets() {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return Array.from({ length: 7 }, (_, index) => {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 6 + index);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      start,
      end,
      label: start.toLocaleDateString("en-US", { weekday: "short" }),
    };
  });
}

export function Dashboard() {
  const [d, setD] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const chartConfig = {
    deposit: { label: "Deposit", color: "#3b82f6" },
    withdrawal: { label: "Withdraw", color: "#f43f5e" },
    transfer: { label: "Transfer", color: "#10b981" },
  };

  useEffect(() => {
    api("/dashboard").then(setD);
  }, []);

  useEffect(() => {
    let cancelled = false;

    api("/transactions")
      .then((data) => {
        if (!cancelled) {
          setTransactions(data);
          setActivityError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setActivityError(error.message || "Failed to load activity");
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activityData = useMemo(() => {
    const buckets = getActivityBuckets().map((bucket) => ({
      ...bucket,
      deposit: 0,
      withdrawal: 0,
      transfer: 0,
    }));
    const seriesByType = {
      DEPOSIT: "deposit",
      WITHDRAWAL: "withdrawal",
      TRANSFER: "transfer",
    };

    transactions.forEach((transaction) => {
      if (transaction.status !== "COMPLETED") return;
      const series = seriesByType[transaction.transaction_type];
      if (!series) return;

      const createdAt = new Date(transaction.created_at);
      if (Number.isNaN(createdAt.getTime())) return;
      const bucket = buckets.find(
        (item) => createdAt >= item.start && createdAt < item.end,
      );
      if (bucket) bucket[series] += Number(transaction.amount) || 0;
    });

    return buckets;
  }, [transactions]);

  if (!d)
    return (
      <div className="py-20 text-center text-slate-500">
        Loading dashboard...
      </div>
    );
  const active = d.status !== "FROZEN";
  return (
    <>
      <PageTitle title="Dashboard" description="Your wallet at a glance">
      </PageTitle>
      <div className="grid gap-4 lg:grid-cols-10">
        <div
            className="rise-in group relative isolate flex min-h-[300px] flex-col overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-[#102B65] via-[#1649A5] to-[#071A3D] p-7 text-white shadow-2xl shadow-blue-950/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-900/40 sm:p-9 lg:col-span-5"
            style={{ "--d": "0ms" }}
          >
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl transition-transform duration-700 group-hover:scale-125" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />

          <div className="pointer-events-none absolute right-0 top-0 h-full w-full opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "18px 18px",
              }}
            />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">
                Wallet Ledger
              </p>
              <p className="mt-1 text-[10px] tracking-[0.2em] text-blue-300/80">
                DIGITAL WALLET
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
              <span className={`h-2 w-2 rounded-full ${
                active ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-red-400"
              }`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {active ? "Active" : "Frozen"}
              </span>
            </div>
          </div>
            
          {/* Chip and Contactless */}
          <div className="relative z-10 mt-7 flex items-center justify-between">
          <div className="relative h-10 w-12 overflow-hidden rounded-lg border border-yellow-200/50 bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-600 shadow-inner">
            <div className="absolute left-1/3 top-0 h-full w-px bg-yellow-800/40" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-yellow-800/40" />
            <div className="absolute left-0 top-1/3 h-px w-full bg-yellow-800/40" />
            <div className="absolute left-0 top-2/3 h-px w-full bg-yellow-800/40" />
          </div>

          <svg
            className="h-7 w-7 text-blue-200/80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M5 9a10 10 0 0 1 0 6" strokeLinecap="round" />
            <path d="M9 6a15 15 0 0 1 0 12" strokeLinecap="round" />
            <path d="M13 3a20 20 0 0 1 0 18" strokeLinecap="round" />
          </svg>
        </div>

          <div className="relative z-10 mt-7">
            <p className="text-xs font-medium tracking-widest text-blue-200/90 uppercase">
              Available Balance
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-4xl font-semibold text-blue-100">৳</span>
              <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                {fmt(d.balance)}
              </p>
              {/* <span className="ml-auto rounded-md border border-white/25 bg-white/10 px-2 py-1 text-[10px] font-bold tracking-wider text-blue-100 backdrop-blur-sm">
                {d.currency}
              </span> */}
            </div>
          </div>
          
        <div className="relative z-10 mt-auto flex items-end justify-between gap-3 pt-8">
          
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-blue-200/70">
              Wallet Number
            </p>
            <p className="mt-1 truncate text-sm font-semibold tracking-[0.16em] sm:text-base">
              {d.wallet_number}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] text-blue-200/70">
              Secured By
            </p>
            <p className="mt-1 text-sm font-black italic tracking-wider text-white/90">
              WALLET<span className="text-cyan-300">.</span>
            </p>
          </div>
        </div>
      </div>
        <div
          className="rise-in rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5"
          style={{ "--d": "80ms" }}
        >
          <div>
            <h2 className="font-bold text-slate-900">Transaction summary</h2>
            <p className="mt-1 text-xs text-slate-500">Last 7 days</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-blue-500" /> Deposit
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-rose-500" /> Withdraw
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-emerald-500" /> Transfer
            </span>
          </div>
          {activityError ? (
            <p role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {activityError}
            </p>
          ) : activityLoading ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Loading activity...
            </p>
          ) : (
            <>
              <div
                role="img"
                aria-label="Deposit, withdrawal, and transfer amounts for the last 7 days"
                className="mt-5 flex h-44 items-end gap-2 border-b border-slate-200 bg-[linear-gradient(to_top,transparent_24.5%,#e2e8f0_25%,transparent_25.5%,transparent_49.5%,#e2e8f0_50%,transparent_50.5%,transparent_74.5%,#e2e8f0_75%,transparent_75.5%)] px-1"
              >
                <ChartContainer config={chartConfig} className="mt-3 aspect-auto h-32 w-full">
                  <BarChart data={activityData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dashed" />}
                    />
                    <Bar dataKey="deposit" fill="var(--color-deposit)" radius={4} />
                    <Bar dataKey="withdrawal" fill="var(--color-withdrawal)" radius={4} />
                    <Bar dataKey="transfer" fill="var(--color-transfer)" radius={4} />
                  </BarChart>
                </ChartContainer>

              </div>
              {!activityData.some(
                (item) => item.deposit || item.withdrawal || item.transfer,
              ) && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  No transaction activity in the last 7 days.
                </p>
              )}
            </>
          )}
        </div>
      </div>
      {d.status === "FROZEN" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your wallet is frozen. You may deposit to restore the configured
          minimum balance, then an admin can unfreeze it.
        </p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Today volume"
          value={`${d.today_volume} ${d.currency}`}
          className="rise-in lift"
        />
        <Card
          title="Today transactions"
          value={d.today_count}
          className="rise-in lift"
        />
        <Card
          title="Fees paid today"
          value={`${d.fees} ${d.currency}`}
          hint={`Withdrawal: ৳${Number(d.withdrawal_fee_per_1000)} per ৳1,000 · Transfer: ৳${Number(d.transfer_fee)} flat`}
          className="rise-in lift"
        />
        <Card
          title="Pending withdrawals"
          value={d.pending_withdrawals}
          hint="Waiting for admin approval"
          href="/dashboard/pending-withdrawals"
          className="rise-in lift cursor-pointer"
        />
      </div>
    </>
  );
}

export function PendingWithdrawals(){
  const [items,setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false;

    async function load(){
      try {
        const data = await api("/withdrawals")
        if (!cancelled) {
          setItems(data.filter((item) => item.status === "PENDING"))
          setErr("")
        }
      } catch (err) {
        if (!cancelled) setErr(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center justify-center gap-1 m-2 p-2 rounded-xl text-sm hover:bg-gray-100 transition"
        >
            <IoIosArrowBack className = "text-lg"/> Back
      </button>
      <PageTitle
        title="My pending withdrawals"
        description="Withdrawal and transfer requests waiting for admin approval."
      />
      <Error>{err}</Error>
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Loading pending withdrawals...
        </p>
      ) : (
        <PagedTable
          rows={items.map((item) => ({
            ...item,
            amount: `${item.amount} BDT`,
            fee: `${item.fee ?? 0} BDT`,
            created_at: item.created_at
              ? new Date(item.created_at).toLocaleString()
              : "",
          }))}
          cols={[
            "reference_number",
            "transaction_type",
            "amount",
            "fee",
            "status",
            "created_at",
          ]}
        />
      )}
    </div>
  )
}

const roundMoney = (n) => Math.round(n * 100) / 100;

// Informational only - the backend is the source of truth for approval rules.
function needsApprovalHint(info, total) {
  if (!info || !(total > 0)) return "";
  const balance = Number(info.balance);
  if (total >= (balance * Number(info.approval_percentage)) / 100)
    return `This is ${Number(info.approval_percentage)}% or more of your balance, so it will be sent to an admin for approval.`;
  if (balance - total < Number(info.minimum_balance))
    return `This would leave your balance below ৳${fmt(info.minimum_balance)}, so it will be sent to an admin for approval.`;
  return "";
}

function MoneyForm({ type }) {
  const isWithdrawal = type === "Withdrawal";
  const [amount, setAmount] = useState("");
  const [info, setInfo] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const refresh = () => api("/dashboard").then(setInfo).catch(() => {});
  useEffect(() => {
    refresh();
  }, []);

  const num = parseFloat(amount);
  const valid = num > 0;
  const fee =
    isWithdrawal && info && valid
      ? roundMoney((num * Number(info.withdrawal_fee_per_1000)) / 1000)
      : 0;
  const total = valid ? roundMoney(num + fee) : 0;
  const lowBalance =
    isWithdrawal && info && Number(info.balance) <= Number(info.minimum_balance);
  const hint = isWithdrawal ? needsApprovalHint(info, total) : "";

  const warnLowBalance = (message) =>
    toast.warning("Withdrawal not allowed", {
      description:
        message ||
        `Your balance is ৳${fmt(info?.balance)}, which is at or below the minimum balance of ৳${fmt(info?.minimum_balance)}.`,
    });

  const deposit = async () => {
    setBusy(true);
    try {
      const r = await api("/deposits", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      toast.success("Deposit successful", {
        description: `৳${fmt(r.amount)} added · ${r.reference_number} · balance ৳${fmt(r.balance)}`,
      });
      setAmount("");
      refresh();
    } catch (e) {
      toast.error("Deposit failed", { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (password) => {
    try {
      const r = await api("/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount, password }),
      });
      setConfirmOpen(false);
      setAmount("");
      refresh();
      if (r.status === "PENDING") {
        toast.info("Sent for admin approval", {
          description: `${r.reference_number} · ${r.message || "Waiting for approval."} Fee ৳${fmt(r.fee)}.`,
        });
      } else {
        toast.success("Withdrawal successful", {
          description: `৳${fmt(r.amount)} withdrawn · fee ৳${fmt(r.fee)} · balance ৳${fmt(r.balance)}`,
        });
      }
    } catch (e) {
      if (e.code === "BAD_PASSWORD") throw e;
      setConfirmOpen(false);
      if (e.code === "MIN_BALANCE") warnLowBalance(e.message);
      else toast.error("Withdrawal failed", { description: e.message });
    }
  };

  const start = () => {
    if (!valid) return toast.error("Enter a valid amount");
    if (!isWithdrawal) return deposit();
    if (lowBalance) return warnLowBalance();
    setConfirmOpen(true);
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle
        title={type}
        description={
          isWithdrawal
            ? "A small fee applies. Large withdrawals and requests that use the minimum-balance reserve require admin approval."
            : "Add money through the system cash account."
        }
      />
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="flex items-center justify-center gap-1 m-2 p-2 rounded-xl text-sm hover:bg-gray-100 transition"
      >
        <IoIosArrowBack className="text-lg" /> Back
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {lowBalance && (
          <p className="mb-4 flex items-start gap-2 rounded-xl bg-white border px-4 py-3 text-sm text-red-700">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            Your balance is ৳{fmt(info.balance)}, which is at the minimum
            balance of ৳{fmt(info.minimum_balance)}. Withdrawals are not
            allowed until you deposit more.
          </p>
        )}
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
        {isWithdrawal && valid && info && (
          <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>
                Fee (৳{Number(info.withdrawal_fee_per_1000)} per ৳1,000)
              </span>
              <span className="font-semibold text-slate-900">৳{fmt(fee)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total deducted</span>
              <span className="font-semibold text-slate-900">৳{fmt(total)}</span>
            </div>
          </div>
        )}
        {hint && (
          <p className="flex gap-2 mt-3 rounded-xl border px-4 py-3 text-sm text-red-700">
            <CircleAlert /> {hint}
          </p>
        )}
        <div className="mt-5">
          <button className={primary} onClick={start} disabled={busy}>
            {busy ? "Processing..." : type}
          </button>
        </div>
      </div>
      <PasswordConfirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Withdrawal"
        description={`Enter your password to withdraw ৳${fmt(num)} (fee ৳${fmt(fee)}).`}
        confirmLabel="Confirm"
        onConfirm={withdraw}
      />
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
    [info, setInfo] = useState(null),
    [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const refresh = () => api("/dashboard").then(setInfo).catch(() => {});
  useEffect(() => {
    refresh();
  }, []);

  const num = parseFloat(a);
  const valid = num > 0;
  const fee = info ? Number(info.transfer_fee) : 0;
  const total = valid ? roundMoney(num + fee) : 0;
  const hint = needsApprovalHint(info, total);

  const send = async (password) => {
    try {
      const x = await api("/transfers", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          receiver_wallet_number: r,
          amount: a,
          note: n || null,
          password,
        }),
      });
      setConfirmOpen(false);
      setA("");
      setN("");
      setReceiver(null);
      setR("");
      refresh();
      if (x.status === "PENDING") {
        toast.info("Transfer sent for admin approval", {
          description: `${x.reference_number} · ${x.message || "Waiting for approval."} Fee ৳${fmt(x.fee)}.`,
        });
      } else {
        toast.success("Transfer successful", {
          description: `৳${fmt(x.amount)} sent to ${receiver?.full_name} · fee ৳${fmt(x.fee)} · ${x.reference_number}`,
        });
      }
    } catch (e) {
      if (e.code === "BAD_PASSWORD") throw e;
      setConfirmOpen(false);
      toast.error("Transfer failed", { description: e.message });
    }
  };

  const start = () => {
    if (!valid) return toast.error("Enter a valid amount");
    setConfirmOpen(true);
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle
        title="Transfer money"
        description="A flat fee applies to every transfer. Transfers at or above the approval threshold are held for admin approval."
      />
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="flex items-center justify-center gap-1 m-2 p-2 rounded-xl text-sm hover:bg-gray-100 transition"
      >
        <IoIosArrowBack className="text-lg" /> Back
      </button>
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
                } catch (e) {
                  setReceiver(null);
                  toast.error("Receiver not found", { description: e.message });
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
            <p className="mt-1 font-bold text-slate-950">{receiver.full_name}</p>
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
        {valid && info && (
          <div className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Transfer fee (flat)</span>
              <span className="font-semibold text-slate-900">৳{fmt(fee)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total deducted</span>
              <span className="font-semibold text-slate-900">৳{fmt(total)}</span>
            </div>
          </div>
        )}
        {hint && (
          <p className="flex gap-2 border rounded-xl bg-white px-4 py-3 text-sm text-red-700">
            <CircleAlert /> {hint}
          </p>
        )}
        {receiver && (
          <button className={primary} onClick={start}>
            Confirm Transfer
          </button>
        )}
      </div>
      <PasswordConfirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Transfer"
        description={`Enter your password to send ৳${fmt(num)} to ${receiver?.full_name ?? "the receiver"} (fee ৳${fmt(fee)}).`}
        confirmLabel="Confirm"
        onConfirm={send}
      />
    </div>
  );
}

export function Transactions() {
  const [t, setT] = useState([]),
    [type, setType] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [applied, setApplied] = useState({ type: "", start: "", end: ""});
  const { withPassword, dialog: pdfDialog } = usePdfPassword();
  const navigate = useNavigate()
  const load = () => {
    const q = new URLSearchParams();
    if (type) q.set("transaction_type", type);
    if (start) q.set("start_date", start);
    if (end) q.set("end_date", end);
    setApplied({ type, start, end });
    api("/transactions?" + q).then(setT);
  };
  useEffect(load, []);

  const num = (v) => (v === null || v === undefined || v === "" ? "" : fmt(v));
  const downloadPdf = (password) => {
    const parts = [
      applied.type || "All types",
      applied.start && `from ${applied.start}`,
      applied.end && `to ${applied.end}`,
    ].filter(Boolean);
    downloadTablePdf({
      title: "Transaction history",
      subtitle: parts.join(" · "),
      summary: [["Transactions", String(t.length)]],
      head: [
        [
          "Reference",
          "Type",
          "Status",
          "Debit (BDT)",
          "Credit (BDT)",
          "Fee (BDT)",
          "Balance (BDT)",
          "Date",
        ],
      ],
      body: t.map((x) => [
        x.reference_number,
        x.transaction_type,
        x.status,
        num(x.debit),
        num(x.credit),
        num(x.fee),
        num(x.balance),
        x.created_at ? new Date(x.created_at).toLocaleString() : "",
      ]),
      rightAlign: [3, 4, 5, 6],
      orientation: "landscape",
      password,
      filename: `transactions-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
    toast.success("PDF downloaded", {
      description: "Open the pdf with your account password",
    });
  };
  return (
    <>
      <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center justify-center gap-1 m-2 p-2 rounded-xl text-sm hover:bg-gray-100 transition"
        >
            <IoIosArrowBack className = "text-lg"/> Back
      </button>
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
        <button
          type="button"
          className={`${secondary} gap-2 whitespace-nowrap`}
          onClick={() => withPassword(downloadPdf)}
          disabled={t.length === 0}
        >
          <Download className="size-4" /> Download PDF
        </button>
        {pdfDialog}
      </div>
      <PagedTable
        rows={t.map((x) => ({
          ...x,
          created_at: x.created_at ? new Date(x.created_at).toLocaleString() : "",
        }))}
        resetKey={`${type}|${start}|${end}`}
        cols={[
          "reference_number",
          "transaction_type",
          "status",
          "debit",
          "credit",
          "fee",
          "balance",
          "created_at",
        ]}
      />
    </>
  );
}

export function AdminDashboard() {
  const [d, setD] = useState(null);
  const navigate= useNavigate()
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
      <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center justify-center gap-1 m-2 p-2 rounded-xl text-sm hover:bg-gray-100 transition"
        >
            <IoIosArrowBack className = "text-lg"/> Back
      </button>
      <PageTitle
        title="Admin dashboard"
        description="System-wide wallet, ledger and reconciliation overview"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(d).map(([k, v]) => (
          <Card key={k} title={k.replaceAll("_", " ")} value={String(v)} />
        ))}
      </div>
      {/* <div className="mt-6 flex flex-wrap gap-3">
        <Link className={secondary} to="/admin/users">
          Accounts
        </Link>
        <Link className={secondary} to="/admin/withdrawals">
          Pending withdrawals
        </Link>
        <Link className={secondary} to="/admin/transactions">
          Transactions
        </Link>
        <Link className = {secondary} to ="/admin/history">
          Admin Activity History
        </Link>
      </div> */}
    </>
  );
}
export function AdminUsers() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate()
  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim());
      const query = params.toString();
      const result = await api(`/admin/users${query ? `?${query}` : ""}`);
      setRows(result);
      setErr("");
    } catch (err) {
      setErr(err.message);
    }
  }
  useEffect(() =>{
    load()
  }, [search]);
  return (
    <>
      <button
          type="button"
          onClick={() => navigate("/admin")}
          className="flex items-center justify-center gap-1 m-2 p-2 rounded-xl text-sm hover:bg-gray-100 transition"
        >
            <IoIosArrowBack className = "text-md"/> Back
      </button>
      <PageTitle
        title="Accounts"
        description="View balances and freeze or unfreeze accounts."
      />
      <Error>{err}</Error>
      <div className = "m-2">
        {/* <label className = "min-w-56 flex-1 text-sm font-medium text-slate-700"> */}
            
            <input className ={`${input} mt-1 w-full`}
              type = "search"
              placeholder = "Search by name, email, or wallet number"
              value = {search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}/>
          {/* </label> */}
      </div>
      <PagedTable
        resetKey={search}
        rows={rows.map((r) => ({
          ...r,
          status: (
              <span
                className={
                  r.status === "ACTIVE"
                    ? "font-semibold text-emerald-600"
                    : "font-semibold text-red-800"
                }
              >
                {r.status}
              </span>
              
          ), acc_edit: (
          <button
                className={`${secondary} px-3 py-2`}
                onClick={async () => {
                  try {
                    await api(
                      `/admin/users/${r.id}/${r.status === "FROZEN" ? "unfreeze" : "freeze"}`,
                      { method: "POST" },
                    );
                    toast.success(
                      r.status === "FROZEN" ? "Account unfrozen" : "Account frozen",
                      { description: `${r.full_name} (${r.wallet_number})` },
                    );
                    await load();
                  } catch (err) {
                    toast.error("Action failed", { description: err.message });
                  }
                }}
              >
                {r.status === "FROZEN" ? "Unfreeze" : "Freeze"}
              </button>
          )
        }))}
        cols={["wallet_number", "full_name", "email", "balance", "status", "acc_edit"]}
      />
    </>
  );
}
export function AdminWithdrawals() {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate()
  const load = async () => {
    try {
      const data = await api("/admin/withdrawals")
      setRows(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }
  const reviewWithdrawal = async (row, decision) => {
    setBusyId(row.id);
    setError("");
    try {
      await api(`/admin/withdrawals/${row.id}/${decision}`, {
        method: "POST",
        ...(decision === "reject" && {
          body: JSON.stringify({ rejection_reason: "Rejected by admin" }),
        }),
      });
      const kind = row.transaction_type === "TRANSFER" ? "Transfer" : "Withdrawal";
      if (decision === "approve")
        toast.success(`${kind} approved`, { description: row.reference_number });
      else toast.warning(`${kind} rejected`, { description: row.reference_number });
      await load();
    } catch (err) {
      setError(err.message);
      toast.error("Action failed", { description: err.message });
    } finally {
      setBusyId("");
    }
  };
  useEffect(() => {
    load()
  }, []);
  return (
    <>
    <button
          type="button"
          onClick={() => navigate("/admin")}
          className="flex items-center justify-center gap-1 m-2 p-2 rounded-xl text-sm hover:bg-gray-100 transition"
        >
            <IoIosArrowBack className = "text-lg"/> Back
      </button>
      <PageTitle
        title="Pending withdrawals"
        description="Withdrawals and transfers at or above the approval threshold require review. Minimum amount of 1000tk is needed for the account to stay active."
      />
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <PagedTable
        rows={rows.map((r) => ({
          ...r,
          approval: (
            <button
              type="button"
              disabled={busyId === r.id}
              className="inline-flex min-w-24 items-center justify-center rounded-lg bg-white border border-emerald-400 text-black px-4 py-2 text-sm font-semibold hover:text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              onClick={() => reviewWithdrawal(r, "approve")}
            >
              {busyId === r.id ? "Working..." : "Approve"}
            </button>
          ),
          reject: (
            <button
              type="button"
              disabled={busyId === r.id}
              className="inline-flex min-w-24 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              onClick={() => reviewWithdrawal(r, "reject")}
            >
              {busyId === r.id ? "Working..." : "Reject"}
            </button>
          ),
        }))}
        cols={[
          "reference_number",
          "transaction_type",
          "wallet_number",
          "amount",
          "fee",
          "status",
          "approval",
          "reject"
        ]}
        centeredCols={["approval", "reject"]}
      />
    </>
  );
}
export function AdminTransactions() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate()
  const load = async () => {
    try {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    const result = await api(`/admin/transactions?${params.toString()}`);
    setRows(result);
    setErr("");
    } catch (err) {
      setErr(err.message);
    };
  };
  useEffect(() => {
    load()
  }, [search]);
  return (
    <>
      <button
          type="button"
          onClick={() => navigate("/admin")}
          className="flex items-center justify-center gap-1 m-2 p-2 rounded-xl text-sm hover:bg-gray-100 transition"
        >
        <IoIosArrowBack className = "text-lg"/> Back
      </button>
      <PageTitle
        title="All transactions"
        description="Review completed transactions and create reversals."
      />
      <Error>{err}</Error>
      <div className = "m-2">
        {/* <label className = "min-w-56 flex-1 text-sm font-medium text-slate-700"> */}
            
            <input className ={`${input} mt-1 w-full`}
              type = "search"
              placeholder = "Search by wallet number"
              value = {search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}/>
          {/* </label> */}
      </div>
      <PagedTable
        resetKey={search}
        rows={rows.map((r) => ({
          ...r,
          reversal: (
        <button
                className={secondary}
                onClick={async () => {
                  if (confirm(`Reverse ${r.reference_number}?`)) {
                    try {
                      await api(`/admin/transactions/${r.id}/reverse`, {
                        method: "POST",
                      });
                      toast.success("Transaction reversed", {
                        description: r.reference_number,
                      });
                      load();
                    } catch (e) {
                      toast.error("Reversal failed", { description: e.message });
                    }
                  }
                }}
              >
                Reverse
        </button>
        )
        }))}
        cols={[
          "reference_number",
          "wallet_number",
          "full_name",
          "transaction_type",
          "status",
          "amount",
          "reversal"
        ]}
      />
    </>
  );
}

export function AdminActivity() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;
  const navigate = useNavigate()
  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      if (search.trim()) params.set("search", search.trim());      const result = await api(`/admin/history?${params.toString()}`);
      setItems(result.items ?? []);
      setTotal(result.total ?? 0);
    } catch (error) {
      setErr(error.message || "Failed to load admin activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [startDate, endDate, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rows = items.map((item) => ({
    ...item,
    created_at: new Date(item.created_at).toLocaleString(),
  }));

  return (
    <>
      <button
          type="button"
          onClick={() => navigate("/admin")}
          className="flex items-center justify-center gap-1 m-2 p-2 rounded-xl text-sm hover:bg-gray-100 transition"
        >
        <IoIosArrowBack className = "text-lg"/> Back
      </button>
      <PageTitle
        title="Admin Activities"
        description="Review administrative actions recorded in the activity log."
      />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium text-slate-700">
          Start Date
            <input
              className={`${input} mt-1`}
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => {
                setPage(1);
                setStartDate(event.target.value);
              }}
            />
          </label>
          <label className ="text-sm font-medium text-slate-700">
            End Date
            <input
              className={`${input} mt-1`}
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setPage(1);
                setEndDate(event.target.value);
              }}
            />
          </label>
          <label className = "min-w-56 flex-1 text-sm font-medium text-slate-700">
            Search activity
            <input className ={`${input} mt-1 w-full`}
              type = "search"
              placeholder = "Search by wallet number"
              value = {search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}/>
          </label>
        <button className={secondary} type="button" onClick={load}>
          Refresh
        </button>
      </div>
      {err && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </p>
      )}
      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading activity history...
        </p>
      ) : (
        <Table
          rows={rows}
        cols={[
          "id",
          "admin_id",
          "wallet_number",
          "users_name",
          "action",
          "target_type",
          "users_email",
          "status",
          "description",
          "created_at"
        ]}
        />
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>
          {total === 0
            ? "No activity records"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                page * pageSize,
                total,
              )} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            className={secondary}
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className={secondary}
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
