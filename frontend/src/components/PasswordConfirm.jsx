import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";


export default function PasswordConfirm({
  open,
  onOpenChange,
  title = "Confirm with your password",
  description,
  confirmLabel = "Confirm",
  onConfirm,
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
      setBusy(false);
    }
  }, [open]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err.message || "Verification failed");
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent size="sm">
        <form onSubmit={submit} className="grid gap-5">
          <AlertDialogHeader>
            <div className="mb-1 grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-blue-600">
              <LockKeyhole className="size-5" />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <input
              autoFocus
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button type="submit" disabled={!password || busy} className="cursor-pointer bg-blue-700! text-white! hover:bg-blue-800! disabled:opacity-60">
              {busy ? "Verifying..." : confirmLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
