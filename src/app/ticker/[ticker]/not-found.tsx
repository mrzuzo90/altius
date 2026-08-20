import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="font-display text-graphite text-[40px] leading-[1.2] tracking-[-0.8px]">Ticker no encontrado</h1>
      <p className="text-steel mt-5 text-[17px] leading-[1.5] text-pretty">
        Ese símbolo no aparece en el registro de la SEC. Altius solo cubre empresas que presentan
        cuentas en Estados Unidos: las extranjeras que presentan formulario 20-F y las que cotizan
        únicamente fuera de EE. UU. no están disponibles.
      </p>
      <Link href="/" className="font-display text-graphite link-ember mt-8 inline-block text-[16px] tracking-[-0.02em]">
        Volver al inicio
      </Link>
    </div>
  );
}
