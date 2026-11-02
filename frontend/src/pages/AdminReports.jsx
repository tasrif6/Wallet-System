import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, Download, RefreshCw, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { downloadTablePdf } from "../lib/pdf";

const money = (v) =>
  Number(v ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function Header({ title, description, onRefresh, loading, onDownload }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className ="flex gap-2">
      <button className={btn} onClick={onDownload} disabled={!onDownload}>
          <Download className="size-4" />
          Download PDF
        </button>
      <button className={btn} onClick={onRefresh} disabled={loading}>
        <RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "default", hint }) {
  const tones = {
    default: "text-slate-950",
    good: "text-emerald-600",
    bad: "text-red-600",
  };
  return (
    <div className="rise-in lift rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const TYPE_LABELS = {
  USER_WALLET: "User wallet",
  CASH_IN_OUT: "Cash in / out",
};
const prettyType = (t) => TYPE_LABELS[t] ?? String(t ?? "");

export function TrialBalance() {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [page, setPage] = useState(1);
  const load = async () => {
    setLoading(true);
    try {
      setD(await api("/admin/reports/trial-balance"));
    } catch (e) {
      toast.error("Could not load trial balance", { description: e.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    setPage(1);
  }, [hideEmpty]);

  const balanced = d && Number(d.difference) === 0;
  const all = d?.accounts ?? [];
  const list = hideEmpty
    ? all.filter((a) => Number(a.debit) || Number(a.credit))
    : all;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = list.slice(start, start + PAGE_SIZE);
  const downloadPdf = () =>
    downloadTablePdf({
      title: "Trial Balance",
      subtitle: hideEmpty ? "Accounts with activity" : "All accounts",
      summary: [
        ["Total debit (BDT)", money(d.total_debit)],
        ["Total credit (BDT)", money(d.total_credit)],
        ["Difference (BDT)", money(d.difference)],
        ["Status", balanced ? "Balanced" : "Out of balance"],
      ],
      head: [["Account", "Type", "Debit (BDT)", "Credit (BDT)", "Balance (BDT)"]],
      body: list.map((a) => [
        a.account,
        prettyType(a.account_type),
        money(a.debit),
        money(a.credit),
        money(a.balance),
      ]),
      foot: [
        [
          "Total (all accounts)",
          "",
          money(d.total_debit),
          money(d.total_credit),
          money(d.difference),
        ],
      ],
      rightAlign: [2, 3, 4],
      filename: `trial-balance-${new Date().toISOString().slice(0, 10)}.pdf`,
  });
  return (
    <div className="mx-auto max-w-5xl">
      <Header
        title="Trial Balance"
        description="Every account's debits and credits, with the grand totals at the bottom. They must be equal."
        onRefresh={load}
        loading={loading}
        onDownload={d ? downloadPdf : undefined}
      />
      {!d ? (
        <p className="py-16 text-center text-slate-500">Loading...</p>
      ) : (
        <>
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium ${
              balanced
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {balanced ? (
              <CircleCheck className="size-5 shrink-0" />
            ) : (
              <CircleAlert className="size-5 shrink-0" />
            )}
            {balanced
              ? "The ledger is balanced. Total debits equal total credits."
              : "The ledger is out of balance. Investigate the difference below."}
          </div>

          <button
            type="button"
            onClick={() => setHideEmpty(!hideEmpty)}
            className={`mb-4 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              hideEmpty
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {hideEmpty ? "Hiding inactive accounts" : "Showing all accounts"}
          </button>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Debit</th>
                  <th className="px-5 py-3 text-right">Credit</th>
                  <th className="px-5 py-3 text-right">Ledger </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((a) => (
                  <tr key={a.account} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {a.account}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {prettyType(a.account_type)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">
                      ৳ {money(a.debit)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">
                      ৳ {money(a.credit)}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-semibold ${
                        Number(a.balance) < 0 ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      ৳ {money(a.balance)}
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No ledger activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-950">
                <tr>
                  <td className="px-5 py-4" colSpan={2}>
                    Total (all accounts)
                  </td>
                  <td className="px-5 py-4 text-right">
                    ৳ {money(d.total_debit)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    ৳ {money(d.total_credit)}
                  </td>
                  <td
                    className={`px-5 py-4 text-right ${
                      balanced ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    Difference: ৳ {money(d.difference)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              {list.length === 0
                ? "No records"
                : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, list.length)} of ${list.length} accounts`}
            </span>
            <div className="flex items-center gap-2">
              <button
                className={btn}
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                Previous
              </button>
              <span>
                Page {safePage} of {totalPages}
              </span>
              <button
                className={btn}
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const PAGE_SIZE = 10;

export function Reconciliation() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      setRows(await api("/admin/reports/reconciliation"));
    } catch (e) {
      toast.error("Could not load reconciliation", { description: e.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const all = rows ?? [];
  const mismatched = all.filter((r) => !r.matches);
  const list = filter === "mismatch" ? mismatched : all;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = list.slice(start, start + PAGE_SIZE);
  const downloadPdf = () =>
    downloadTablePdf({
      title: "Reconciliation",
      subtitle: filter === "mismatch" ? "Mismatches only" : "All wallets",
      summary: [
        ["Wallets checked", String(all.length)],
        ["Matched", String(all.length - mismatched.length)],
        ["Mismatches", String(mismatched.length)],
      ],
      head: [
        [
          "Wallet",
          "Stored balance (BDT)",
          "Ledger balance (BDT)",
          "Difference (BDT)",
          "Status",
        ],
      ],
      body: list.map((r) => [
        r.wallet_number,
        money(r.cached_balance),
        money(r.ledger_balance),
        money(Number(r.cached_balance) - Number(r.ledger_balance)),
        r.matches ? "Matched" : "Mismatch",
      ]),
      rightAlign: [1, 2, 3],
      filename: `reconciliation-${new Date().toISOString().slice(0, 10)}.pdf`,
  });
  return (
    <div className="mx-auto max-w-5xl">
      <Header
        title="Reconciliation"
        description="Compares each wallet's stored balance with the balance rebuilt from the ledger."
        onRefresh={load}
        loading={loading}
        onDownload={rows ? downloadPdf : undefined}
      />
      {!rows ? (
        <p className="py-16 text-center text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Wallets checked" value={all.length} />
            <Stat
              label="Matched"
              value={all.length - mismatched.length}
              tone="good"
            />
            <Stat
              label="Mismatches"
              value={mismatched.length}
              tone={mismatched.length ? "bad" : "good"}
            />
          </div>

          <div className="mt-6 flex gap-2">
            {[
              ["all", "All wallets"],
              ["mismatch", "Mismatches only"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  filter === key
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Wallet</th>
                  <th className="px-5 py-3 text-right">Cached balance</th>
                  <th className="px-5 py-3 text-right">Ledger balance</th>
                  <th className="px-5 py-3 text-right">Difference</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((r) => (
                  <tr key={r.wallet_number} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {r.wallet_number}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">
                      ৳ {money(r.cached_balance)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">
                      ৳ {money(r.ledger_balance)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">
                      ৳ {money(Number(r.cached_balance) - Number(r.ledger_balance))}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          r.matches
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.matches ? "Matched" : "Mismatch"}
                      </span>
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      {filter === "mismatch"
                        ? "No mismatches found. Every wallet matches the ledger."
                        : "No wallets yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              {list.length === 0
                ? "No records"
                : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, list.length)} of ${list.length}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                className={btn}
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                Previous
              </button>
              <span>
                Page {safePage} of {totalPages}
              </span>
              <button
                className={btn}
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}