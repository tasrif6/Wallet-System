import { useSyncExternalStore } from "react";

const KEY = "theme";
const root = document.documentElement;

function initial() {
  const saved = localStorage.getItem(KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
function apply(t) {
  root.classList.toggle("dark", t === "dark");
}
apply(initial());

const listeners = new Set();
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const snapshot = () => (root.classList.contains("dark") ? "dark" : "light");

export function toggleTheme() {
  const next = snapshot() === "dark" ? "light" : "dark";
  localStorage.setItem(KEY, next);
  apply(next);
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, snapshot);
  return { theme, toggle: toggleTheme };
}