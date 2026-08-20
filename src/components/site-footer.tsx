import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20">
      <div className="border-mist mx-auto max-w-[1200px] border-t px-5 py-10">
        <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
          <span className="font-display text-graphite text-[16px] tracking-[-0.02em]">Altius</span>
          <p className="text-steel max-w-md text-[14px] leading-[1.43]">
            Cada cifra procede de un documento público. Si una empresa no reporta un concepto,
            aquí aparece una raya en lugar de un número inventado.
          </p>
          <nav className="text-slate ml-auto flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            <a href="https://www.sec.gov/edgar" target="_blank" rel="noreferrer noopener" className="hover:text-graphite transition-colors">
              SEC EDGAR
            </a>
            <a href="https://fred.stlouisfed.org/" target="_blank" rel="noreferrer noopener" className="hover:text-graphite transition-colors">
              FRED
            </a>
            <Link href="/macro" className="hover:text-graphite transition-colors">
              Macro
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
