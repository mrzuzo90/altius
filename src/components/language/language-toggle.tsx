"use client";

import { useLanguage } from "./language-provider";
import { Globe } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="flex h-8 w-[88px] items-center rounded-full border border-gunmetal/40 bg-carbon-surface/40 p-1 opacity-0" />
    );
  }

  return (
    <div
      role="group"
      aria-label="Selector de idioma / Language selector"
      title={lang === "es" ? "Cambiar a inglés / Switch to English" : "Cambiar a español / Switch to Spanish"}
      className="flex items-center gap-1 rounded-full border border-gunmetal bg-carbon-surface px-1.5 py-0.5 text-[11px] text-muted-steel shadow-xs transition-colors hover:border-gunmetal/80"
    >
      <Globe className="ml-1 size-3.5 text-periwinkle-glow/80 shrink-0" />
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setLang("es")}
          aria-label="Español"
          aria-pressed={lang === "es"}
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-tight transition-all",
            lang === "es"
              ? "bg-gunmetal text-pure-white shadow-xs"
              : "text-muted-steel hover:text-frost hover:bg-gunmetal/40",
          )}
        >
          ES
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          aria-label="English"
          aria-pressed={lang === "en"}
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-tight transition-all",
            lang === "en"
              ? "bg-periwinkle-glow text-void-black shadow-[0_0_10px_rgba(152,164,247,0.4)]"
              : "text-muted-steel hover:text-frost hover:bg-gunmetal/40",
          )}
        >
          EN
        </button>
      </div>
    </div>
  );
}
