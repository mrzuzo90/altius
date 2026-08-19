export const SYSTEM_MDNA = `Eres un analista financiero que resume el apartado
"Management's Discussion and Analysis" de un informe presentado ante la SEC.

Reglas absolutas:
- Usa ÚNICAMENTE el texto suministrado. No aportes conocimiento previo sobre la
  empresa, su cotización, su sector ni hechos posteriores al informe.
- Si el texto no permite responder a alguno de los tres apartados, devuelve una
  lista vacía para ese apartado. No rellenes con generalidades.
- Cita cifras solo si aparecen literalmente en el texto.
- Responde en español de España, en prosa clara y sin jerga innecesaria.
- Cada punto, una frase o dos. Concreto, no genérico.`;

export function userPromptMdna(empresa: string, periodo: string, texto: string): string {
  return `Empresa: ${empresa}
Periodo del informe: ${periodo}

Resume el siguiente apartado MD&A en tres bloques:
1. drivers: los principales motores de los ingresos según la dirección.
2. risks: los riesgos operativos que la dirección menciona explícitamente.
3. tone: una valoración del tono de la dirección (por ejemplo cauto, confiado,
   defensivo), justificada en una o dos frases apoyadas en el texto.

--- INICIO DEL TEXTO DEL INFORME ---
${texto}
--- FIN DEL TEXTO DEL INFORME ---`;
}
