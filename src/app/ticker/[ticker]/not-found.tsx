import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="font-display text-graphite text-[40px] leading-[1.2] tracking-[-0.8px]">Ticker no encontrado</h1>
      <p className="text-steel mt-5 text-[17px] leading-[1.5] text-pretty">
        No hemos podido asociar ese símbolo a una cotización y a una fuente regulatoria estructurada.
        Prueba el ticker local con el sufijo de mercado, por ejemplo ITX.MC, SHOP.TO, BHP.AX o SHEL.L.
        Altius consulta SEC EDGAR, ESEF europeo y emisores internacionales con cotización local.
      </p>
      <Link href="/" className="font-display text-graphite link-ember mt-8 inline-block text-[16px] tracking-[-0.02em]">
        Volver al inicio
      </Link>
    </div>
  );
}
