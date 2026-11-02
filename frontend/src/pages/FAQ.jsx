
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoIosArrowBack,
  IoIosArrowDown,
  IoIosArrowUp,
  IoIosSearch,
} from "react-icons/io";

const faqs = [
  {
    category: "Wallet & Account",
    question: "How can I find my wallet number?",
    answer:
      "Sign in and open your Dashboard. Your wallet number is displayed in your wallet information section.",
  },
  {
    category: "Wallet & Account",
    question: "Why is my wallet frozen?",
    answer:
      "An administrator may freeze a wallet. Certain transactions will be unavailable while it is frozen. Contact your administrator for assistance.",
  },
  {
    category: "Deposits",
    question: "How do I deposit money?",
    answer:
      "Open the Deposit page, enter the amount, and submit your request. Check the displayed status and transaction reference afterward.",
  },
  {
    category: "Withdrawals",
    question: "How do I withdraw money?",
    answer:
      "Open the Withdrawal page, enter the amount, and submit your request. Depending on the configured rules, administrator approval may be required.",
  },
  {
    category: "Withdrawals",
    question: "Why is my withdrawal pending?",
    answer:
      "Your withdrawal may require administrator approval under the configured percentage or minimum-balance rules. Check its status for updates.",
  },
  {
    category: "Transfers",
    question: "How do I transfer money?",
    answer:
      "Open Transfer, enter the receiver's wallet number and amount, review the details, and submit your request.",
  },
  {
    category: "Transfers",
    question: "Why is my transfer pending?",
    answer:
      "A transfer may require administrator approval if it meets the configured approval conditions. Check its status and reference number.",
  },
  {
    category: "Transfers",
    question: "Can I transfer money to my own wallet?",
    answer:
      "No. Transfers between the same sender and receiver wallet are not allowed.",
  },
  {
    category: "Fees & Limits",
    question: "Are there transfer fees?",
    answer:
      "Transfer fees may apply according to the system's configured fee rules. Review the transaction details before confirming.",
  },
  {
    category: "Fees & Limits",
    question: "Why is my available balance lower than my balance?",
    answer:
      "Pending withdrawals, transfer fees, and minimum-balance requirements can affect how much money is available for a new transaction.",
  },
  {
    category: "Wallet & Account",
    question: "Where can I see previous transactions?",
    answer:
      "Open Transactions or View History from your Dashboard to review the transaction records available to your account.",
  },
  {
    category: "Wallet & Account",
    question: "What is a transaction reference number?",
    answer:
      "It identifies a transaction and can help your administrator investigate a transaction-related question.",
  },
  {
    category: "Wallet & Account",
    question: "Why do I need to verify my password or PIN?",
    answer:
      "Verification helps confirm that you are authorized to perform a protected transaction. Never share your password or PIN.",
  },
  {
    category: "Wallet & Account",
    question: "What if I forget my password?",
    answer:
      "Use the Forgot Password option on the sign-in page and follow the password-reset instructions.",
  },
  {
    category: "Wallet & Account",
    question: "What should I do about an unfamiliar transaction?",
    answer:
      "Contact your administrator or support team promptly. Provide the transaction reference if available, but never share your password or PIN.",
  },
];

const categories = [
  "All",
  ...new Set(faqs.map((faq) => faq.category)),
];

export function Faq() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState(null);

  const filteredFaqs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesCategory =
        category === "All" || faq.category === category;

      const matchesSearch =
        !term ||
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term) ||
        faq.category.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <span className="text-2xl font-bold">?</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Frequently Asked Questions
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
          Find answers about your wallet, transactions, and account security.
        </p>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <IoIosSearch className="shrink-0 text-xl text-slate-400" />

        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpenIndex(null);
          }}
          placeholder="Search questions or keywords..."
          aria-label="Search frequently asked questions"
          className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400 focus:ring-0"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setCategory(item);
              setOpenIndex(null);
            }}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              category === item
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className="border-b border-slate-100 last:border-b-0"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left hover:bg-slate-50 sm:px-6"
                >
                  <span className="min-w-0">
                    <span className="mb-1 block text-xs font-medium text-indigo-600">
                      {faq.category}
                    </span>

                    <span className="font-semibold text-white">
                      {faq.question}
                    </span>
                  </span>

                  {isOpen ? (
                    <IoIosArrowUp className="shrink-0 text-xl text-white" />
                  ) : (
                    <IoIosArrowDown className="shrink-0 text-xl text-white" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-7 text-white sm:px-6">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-slate-800">
              No matching questions found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try another keyword or select a different category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
                setOpenIndex(null);
              }}
              className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border bg-gray-800 p-6 text-center">
        <h2 className="font-semibold text-white">
          Still need help?
        </h2>

        <p className="mt-2 text-sm text-white">
          Contact our customer support: Hotline-92581
        </p>
      </div>
    </div>
  );
}
