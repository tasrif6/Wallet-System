import { useState } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Receipt,
  Clock,
  ShieldCheck,
  Users,
  ListChecks,
  Landmark,
  History,
  LogOut,
  Menu,
  Sun,
  Moon,
  Info,
  GitCompareArrows,
  Scale,
  CircleX,
  BangladeshiTaka,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import {
  Login,
  Register,
  ForgotPassword,
  VerifyPassword,
  ResetPassword,
  Dashboard,
  Deposit,
  Withdrawal,
  Transfer,
  Transactions,
  AdminDashboard,
  AdminUsers,
  AdminWithdrawals,
  AdminTransactions,
  AdminActivity,
  PendingWithdrawals,
} from "./pages";
import { Faq } from "./pages/FAQ";
import { useTheme } from "./lib/theme";
import { Reconciliation, TrialBalance } from "./pages/AdminReports";
import PayBill from "./PayBill";


function UserHome() {
  const { user } = useAuth();
  return user?.role === "ADMIN" ? (
    <Navigate to="/admin" replace />
  ) : (
    <Dashboard />
  );
}

function Guard({ children, admin = false }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen grid place-items-center text-slate-500">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "ADMIN")
    return <Navigate to="/dashboard" replace />;
  return children;
}

const userLinks = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/deposit", "Deposit", ArrowDownToLine],
  ["/withdrawal", "Withdrawal", ArrowUpFromLine],
  ["/transfer", "Transfer", ArrowLeftRight],
  ["/paybill", "PayBill", BangladeshiTaka],
  ["/transactions", "Transactions", Receipt],
  ["/dashboard/pending-withdrawals", "Pending", Clock],
  ["/questions", "FAQ", Info]
];
const adminLinks = [
  ["/admin", "Admin Dashboard", ShieldCheck],
  ["/admin/users", "Accounts", Users],
  ["/admin/withdrawals", "Pending Withdrawals", ListChecks],
  ["/admin/transactions", "All Transactions", Landmark],
  ["/admin/history", "Activity History", History],
  ["/admin/trial-balance", "Trial Balance", Scale],
  ["/admin/reconciliation", "Reconciliation", GitCompareArrows],
];

function isActive(pathname, href) {
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItem({ href, label, Icon, active, onClick }) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
          : "text-slate-300 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const links = user?.role === "ADMIN" ? adminLinks : userLinks;
  return (
    <div className="flex h-full flex-col bg-[#0b1f4d] text-white">
      {/* <Link
        to={user?.role === "ADMIN" ? "/admin" : "/dashboard"}
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 py-6"
      > */}
      <div className= "flex items-center gap-3 px-5 py-6">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/40">
          <ShieldCheck className="size-5" />
        </span>
        <span className="text-base font-bold tracking-tight">Wallet Ledger</span>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close menu"
          className="ml-auto cursor-pointer rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <CircleX className="font-bold text-lg"/>
        </button>
      </div>
      {/* </Link> */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {links.map(([href, label, Icon]) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={isActive(pathname, href)}
            onClick={onNavigate}
          />
        ))}
      </nav>
      <button
        onClick={logout}
        className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-red-700 hover:text-white"
      >
        <LogOut className="size-4" />
        Logout
      </button>
    </div>
  );
}

function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const initials = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 animate-in fade-in bg-slate-950/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 animate-in slide-in-from-left duration-200">
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-600 transition hover:rotate-12 hover:bg-slate-100"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            {/* <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-900">
                {user?.full_name || user?.email}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {(user?.role || "user").toLowerCase()}
              </p>
            </div> */}
            <div className="group relative">
              <button
                type="button"
                aria-label="Account details"
                className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white outline-none transition hover:ring-4 hover:ring-blue-600/20 focus-visible:ring-4 focus-visible:ring-blue-600/30"
              >
                {initials}
              </button>
              <div
                role="tooltip"
                className="pointer-events-none invisible absolute right-0 top-full z-30 mt-4 w-64 translate-y-1 rounded-xl border border-slate-200 bg-white p-4 text-left opacity-0 shadow-xl transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
              >
                <span className="absolute -top-1.5 right-3 size-3 rotate-45 border-l border-t border-slate-200 bg-white" />
                <p className="truncate text-sm font-semibold text-slate-900">
                  Name: {user?.full_name}
                </p>
                <p className="mt-1 truncate font-semibold text-sm text-slate-900">E-mail: {user?.email}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div key={location.pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <Guard>
              <Layout>
                <UserHome />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/deposit"
          element={
            <Guard>
              <Layout>
                <Deposit />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/withdrawal"
          element={
            <Guard>
              <Layout>
                <Withdrawal />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/transfer"
          element={
            <Guard>
              <Layout>
                <Transfer />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/paybill"
          element={
            <Guard>
              <Layout>
                <PayBill />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/transactions"
          element={
            <Guard>
              <Layout>
                <Transactions />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/dashboard/pending-withdrawals"
          element={
            <Guard>
              <Layout>
                <PendingWithdrawals />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/questions"
          element={
            <Guard>
              <Layout>
                <Faq />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/admin"
          element={
            <Guard admin>
              <Layout>
                <AdminDashboard />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <Guard admin>
              <Layout>
                <AdminUsers />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <Guard admin>
              <Layout>
                <AdminWithdrawals />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <Guard admin>
              <Layout>
                <AdminTransactions />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/admin/history"
          element={
            <Guard admin>
              <Layout>
                <AdminActivity />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/admin/trial-balance"
          element={
            <Guard admin>
              <Layout>
                <TrialBalance />
              </Layout>
            </Guard>
          }
        />
        <Route
          path="/admin/reconciliation"
          element={
            <Guard admin>
              <Layout>
                <Reconciliation />
              </Layout>
            </Guard>
          }
        />
      </Routes>
      {sessionExpired && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
          aria-describedby="session-expired-description"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl">
            <div className="mx-auto mb-5 flex justify-center items-center grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <Clock className="size-8" />
            </div>
            <h2
              id="session-expired-title"
              className="text-xl font-bold text-slate-950"
            >
              Session Timed Out
            </h2>
            <p
              id="session-expired-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              Your session has ended for your security. Please sign in again to
              continue.
            </p>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
              onClick={() => {
                clearSessionExpired();
                navigate("/login", { replace: true });
              }}
            >
              Return to sign in
            </button>
          </div>
        </div>
      )}
    </>
  );
}
