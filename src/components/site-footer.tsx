import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-gunmetal bg-void-black">
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-periwinkle-glow" />
            <span className="font-display text-pure-white text-[16px] font-medium tracking-tight">Altius</span>
          </div>
          <p className="text-muted-steel max-w-md text-[14px] leading-[1.5]">
            Cada cifra procede de un documento público. Si una empresa no reporta un concepto,
            aquí aparece una raya en lugar de un número inventado.
          </p>
          <nav className="text-muted-steel ml-auto flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            <a href="https://www.sec.gov/edgar" target="_blank" rel="noreferrer noopener" className="hover:text-frost transition-colors">
              SEC EDGAR
            </a>
            <a href="https://fred.stlouisfed.org/" target="_blank" rel="noreferrer noopener" className="hover:text-frost transition-colors">
              FRED
            </a>
            <Link href="/macro" className="hover:text-frost transition-colors">
              Macro
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
