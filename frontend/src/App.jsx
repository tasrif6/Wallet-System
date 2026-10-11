import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import {
  Login,
  Register,
  ForgotPassword,
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
} from "./pages";

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

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const links = [
    ["/dashboard", "Dashboard"],
    ["/transactions", "History"],
    ...(user?.role === "ADMIN" ? [["/admin", "Admin"]] : []),
  ];
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 font-bold text-slate-950"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm text-white">
              W
            </span>
            <span>Wallet Ledger</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map(([href, label]) => (
              <Link
                key={href}
                to={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${location.pathname.startsWith(href) ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="ml-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Logout
            </button>
          </nav>
          <button
            onClick={logout}
            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white sm:hidden"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element = {<ResetPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <Guard>
            <Layout>
              <Dashboard />
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
    </Routes>
  );
}
