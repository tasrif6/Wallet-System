import { useRef, useState } from "react";
import PasswordConfirm from "@/components/PasswordConfirm";
import { useAuth } from "../context/AuthContext";
import { auth } from "../services/api";
import { getSecret, setSecret } from "./sessionSecret";

/**
 * withPassword(run): calls run(accountPassword) right away when the password is
 * known from this login. After a page refresh it asks for it once, verifies it
 * against the server, remembers it in memory, then calls run.
 * Render {dialog} once in the page.
 */
export function usePdfPassword() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const pending = useRef(null);

  const withPassword = (run) => {
    const known = getSecret();
    if (known) return run(known);
    pending.current = run;
    setOpen(true);
  };

  const dialog = (
    <PasswordConfirm
      open={open}
      onOpenChange={setOpen}
      title="Confirm your password"
      description="Your PDF is locked with your account password. Enter it once to continue."
      confirmLabel="Download PDF"
      onConfirm={async (password) => {
        await auth.login({ email: user.email, password }); // throws if wrong
        setSecret(password);
        setOpen(false);
        const run = pending.current;
        pending.current = null;
        run?.(password);
      }}
    />
  );

  return { withPassword, dialog };
}