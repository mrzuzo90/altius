"use client";

import { useTheme } from "./theme-provider";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="size-8 rounded-full border border-mist/40 p-1 opacity-0" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={resolvedTheme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      title={resolvedTheme === "dark" ? "Modo claro" : "Modo oscuro"}
      className="border-mist/60 hover:bg-ash/70 text-slate hover:text-graphite flex size-8 items-center justify-center rounded-full border transition-colors"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-3.5" />
      ) : (
        <Moon className="size-3.5" />
      )}
    </button>
  );
}
