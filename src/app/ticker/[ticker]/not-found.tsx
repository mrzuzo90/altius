import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">Ticker no encontrado</h1>
      <p className="text-muted-foreground mt-2 text-sm text-pretty">
        Ese símbolo no aparece en el registro de la SEC. Altius solo cubre empresas que presentan
        cuentas en Estados Unidos: las extranjeras que presentan formulario 20-F y las que cotizan
        únicamente fuera de EE. UU. no están disponibles.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">
        Volver al inicio
      </Link>
    </div>
  );
}
