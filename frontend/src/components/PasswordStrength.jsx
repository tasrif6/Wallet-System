import { Check, X } from "lucide-react";

export const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "A lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "An uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "A number (0-9)", test: (p) => /\d/.test(p) },
  {
    label: "A special character (@, #, !, $ ...)",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export const isStrongPassword = (p) => passwordRules.every((r) => r.test(p));

const LEVELS = [
  { text: "Too weak", bar: "bg-red-500", color: "text-red-600" },
  { text: "Weak", bar: "bg-red-500", color: "text-red-600" },
  { text: "Fair", bar: "bg-amber-400", color: "text-amber-600" },
  { text: "Good", bar: "bg-amber-400", color: "text-amber-600" },
  { text: "Strong", bar: "bg-blue-500", color: "text-blue-600" },
  { text: "Very strong", bar: "bg-blue-700", color: "text-blue-600" },
];

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = passwordRules.filter((r) => r.test(password)).length;
  const level = LEVELS[passed];
  return (
    <div className="space-y-3 rounded-xl bg-slate-50 p-4">
      <div>
        <div className="flex gap-1.5">
          {passwordRules.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i < passed ? level.bar : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <p className={`mt-2 text-xs font-semibold ${level.color}`}>
          {level.text}
        </p>
      </div>
      <ul className="space-y-1.5">
        {passwordRules.map((r) => {
          const ok = r.test(password);
          return (
            <li
              key={r.label}
              className={`flex items-center gap-2 text-xs ${
                ok ? "text-blue-700" : "text-slate-500"
              }`}
            >
              {ok ? (
                <Check className="size-3.5 shrink-0" />
              ) : (
                <X className="size-3.5 shrink-0 text-slate-400" />
              )}
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}