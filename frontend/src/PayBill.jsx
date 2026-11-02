import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Flame,
  GraduationCap,
  Phone,
  ReceiptText,
  Search,
  ShieldCheck,
  Tv,
  TriangleAlert,
  Wifi,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "./services/api";
import PasswordConfirm from "@/components/PasswordConfirm";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";

const ICONS = {
  zap: Zap,
  flame: Flame,
  droplets: Droplets,
  wifi: Wifi,
  tv: Tv,
  shield: ShieldCheck,
  phone: Phone,
  graduation: GraduationCap,
};
const TONES = {
  electricity: "bg-amber-100 text-amber-600",
  gas: "bg-orange-100 text-orange-600",
  water: "bg-sky-100 text-sky-600",
  internet: "bg-violet-100 text-violet-600",
  tv: "bg-rose-100 text-rose-600",
  insurance: "bg-emerald-100 text-emerald-600",
  telephone: "bg-teal-100 text-teal-600",
  education: "bg-indigo-100 text-indigo-600",
};

const money = (v) =>
  Number(v ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const backBtn =
  "mb-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100";

function CategoryIcon({ category, className = "size-12" }) {
  const Icon = ICONS[category.icon] ?? ReceiptText;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-2xl ${className} ${
        TONES[category.id] ?? "bg-blue-100 text-blue-600"
      }`}
    >
      <Icon className="size-1/2" />
    </span>
  );
}

export default function PayBill() {
  const [data, setData] = useState(null);
  const [info, setInfo] = useState(null);
  const [category, setCategory] = useState(null);
  const [biller, setBiller] = useState(null);
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const navigate = useNavigate()

  
  const refreshInfo = () =>
    api("/dashboard")
      .then(setInfo)
      .catch(() => {});
  useEffect(() => {
    api("/billers")
      .then(setData)
      .catch((e) =>
        toast.error("Could not load billers", { description: e.message }),
      );
    refreshInfo();
  }, []);

  const fee = Number(data?.fee ?? 0);
  const num = parseFloat(amount);
  const valid = num > 0;
  const total = valid ? Math.round((num + fee) * 100) / 100 : 0;
  const balance = Number(info?.balance ?? 0);
  const minimum = Number(info?.minimum_balance ?? 0);
  const tooLow = info && valid && balance - total < minimum;

  const billers = useMemo(() => {
    const list = category?.billers ?? [];
    const term = search.trim().toLowerCase();
    return term ? list.filter((b) => b.name.toLowerCase().includes(term)) : list;
  }, [category, search]);

  const reset = () => {
    setCategory(null);
    setBiller(null);
    setSearch("");
    setAccount("");
    setAmount("");
    setReceipt(null);
  };

  const start = () => {
    if (account.trim().length < 3)
      return toast.error(`Enter a valid ${biller.field_label.toLowerCase()}`);
    if (!valid) return toast.error("Enter a valid amount");
    if (tooLow)
      return toast.warning("Payment not allowed", {
        description: `Your balance must stay at or above ৳${money(minimum)} after the payment.`,
      });
    setConfirmOpen(true);
  };

  const pay = async (password) => {
    try {
      const r = await api("/bill-payments", {
        method: "POST",
        body: JSON.stringify({
          biller_id: biller.id,
          account_number: account.trim(),
          amount,
          password,
        }),
      });
      setConfirmOpen(false);
      setReceipt(r);
      refreshInfo();
      toast.success("Bill paid successfully", {
        description: `${r.biller} · ৳${money(r.amount)} · ${r.reference_number}`,
      });
    } catch (e) {
      if (e.code === "BAD_PASSWORD") throw e; // keep dialog open, show inline
      setConfirmOpen(false);
      if (e.code === "MIN_BALANCE")
        toast.warning("Payment not allowed", { description: e.message });
      else toast.error("Payment failed", { description: e.message });
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center justify-center gap-1 m-2 p-2 rounded-xl text-sm hover:bg-gray-100 transition"
            >
                <IoIosArrowBack className = "text-lg"/> Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Pay Bill
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pay your utility, internet, TV and insurance bills from your wallet.
          </p>
        </div>
        {info && (
          <div className={`${card} px-5 py-3`}>
            <p className="text-xs text-slate-500">Available balance</p>
            <p className="text-lg font-bold text-slate-950">
              ৳ {money(info.balance)}
            </p>
          </div>
        )}
      </div>

      {!data ? (
        <p className="py-16 text-center text-slate-500">Loading...</p>
      ) : receipt ? (
        <div className={`${card} page-enter mx-auto max-w-md p-8 text-center`}>
          <CheckCircle2 className="mx-auto size-14 text-emerald-500" />
          <h2 className="mt-4 text-xl font-bold text-slate-950">
            Payment successful
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your bill has been paid.
          </p>
          <dl className="mt-6 space-y-3 rounded-xl bg-slate-50 p-5 text-left text-sm">
            {[
              ["Biller", receipt.biller],
              ["Account", receipt.account_number],
              ["Amount", `৳ ${money(receipt.amount)}`],
              ["Fee", `৳ ${money(receipt.fee)}`],
              ["Total paid", `৳ ${money(receipt.total_amount)}`],
              ["Reference", receipt.reference_number],
              ["New balance", `৳ ${money(receipt.balance)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-slate-500">{k}</dt>
                <dd className="break-all text-right font-semibold text-slate-900">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <button
            onClick={reset}
            className="mt-6 w-full cursor-pointer rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Pay another bill
          </button>
        </div>
      ) : !category ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.categories.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCategory(c)}
              style={{ "--d": `${i * 40}ms` }}
              className={`${card} rise-in lift flex cursor-pointer flex-col items-center gap-3 p-6 text-center`}
            >
              <CategoryIcon category={c} />
              <span className="font-semibold text-slate-900">{c.name}</span>
              <span className="text-xs text-slate-500">
                {c.billers.length} {c.billers.length === 1 ? "biller" : "billers"}
              </span>
            </button>
          ))}
        </div>
      ) : !biller ? (
        <div className="page-enter">
          <button
            className={backBtn}
            onClick={() => {
              setCategory(null);
              setSearch("");
            }}
          >
            <ArrowLeft className="size-4" /> All categories
          </button>
          <div className="mb-4 flex items-center gap-3">
            <CategoryIcon category={category} className="size-11" />
            <h2 className="text-xl font-bold text-slate-950">{category.name}</h2>
          </div>
          {category.billers.length > 5 && (
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputCls} pl-11`}
                placeholder="Search billers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          <div className={`${card} divide-y divide-slate-100 overflow-hidden`}>
            {billers.map((b) => (
              <button
                key={b.id}
                onClick={() => setBiller(b)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <span className="font-semibold text-slate-900">{b.name}</span>
                <ChevronRight className="size-5 text-slate-400" />
              </button>
            ))}
            {billers.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                No billers match your search.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="page-enter mx-auto max-w-xl">
          <button className={backBtn} onClick={() => setBiller(null)}>
            <ArrowLeft className="size-4" /> {category.name}
          </button>
          <div className={`${card} p-6`}>
            <div className="mb-6 flex items-center gap-3">
              <CategoryIcon category={category} className="size-11" />
              <div>
                <p className="text-xs text-slate-500">{category.name}</p>
                <h2 className="text-lg font-bold text-slate-950">{biller.name}</h2>
              </div>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              {biller.field_label}
            </label>
            <input
              className={`${inputCls} mt-2`}
              placeholder={`Enter ${biller.field_label.toLowerCase()}`}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              maxLength={30}
            />
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Amount
            </label>
            <input
              className={`${inputCls} mt-2`}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {valid && (
              <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Bill amount</span>
                  <span className="font-semibold text-slate-900">
                    ৳{money(num)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fee</span>
                  <span className="font-semibold text-slate-900">
                    ৳{money(fee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total deducted</span>
                  <span className="font-semibold text-slate-900">
                    ৳{money(total)}
                  </span>
                </div>
              </div>
            )}
            {tooLow && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                Your balance must stay at or above ৳{money(minimum)} after the
                payment.
              </p>
            )}
            <button
              onClick={start}
              className="mt-6 w-full cursor-pointer rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Pay bill
            </button>
          </div>
        </div>
      )}

      <PasswordConfirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm payment"
        description={`Enter your password to pay ৳${money(total)} to ${biller?.name ?? "the biller"}.`}
        confirmLabel="Confirm payment"
        onConfirm={pay}
      />
    </div>
  );
}