const BASE_URL = "https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml/INDICATOR";

export interface IndicadorCatalogado {
  codigo: string;
  banco: "BISE" | "BIE-BISE";
  descripcion: string;
}

/**
 * Codigos verificados contra la API real (no adivinados). Cada uno vive en un
 * "banco" de datos distinto dentro de INEGI (BISE para series demograficas
 * historicas, BIE-BISE para la mayoria de indicadores economicos actuales) -
 * pedir el banco equivocado regresa ErrorCode 100, por eso obtenerIndicador()
 * reintenta automaticamente con el otro banco antes de rendirse.
 */
export const INDICADORES_CATALOGO: Record<string, IndicadorCatalogado> = {
  poblacion: { codigo: "1002000001", banco: "BISE", descripcion: "Poblacion total" },
  inflacion: { codigo: "910396", banco: "BIE-BISE", descripcion: "INPC, inflacion mensual (indice)" },
  inpc: { codigo: "910396", banco: "BIE-BISE", descripcion: "INPC, inflacion mensual (indice)" },
  "confianza del consumidor": { codigo: "334497", banco: "BIE-BISE", descripcion: "Indice de confianza del consumidor" },
  "actividad industrial": { codigo: "737173", banco: "BIE-BISE", descripcion: "IGAE, actividad industrial (indice)" },
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export function resolveIndicador(input: string): IndicadorCatalogado {
  const normalized = normalize(input);
  const catalogado = INDICADORES_CATALOGO[normalized];
  if (catalogado) return catalogado;
  if (/^\d+$/.test(input.trim())) {
    return { codigo: input.trim(), banco: "BIE-BISE", descripcion: `Indicador ${input.trim()}` };
  }
  const conocidos = Object.keys(INDICADORES_CATALOGO).join(", ");
  throw new Error(
    `Indicador no reconocido: "${input}". Usa uno de los nombres conocidos (${conocidos}) o un codigo numerico directo de INEGI.`
  );
}

function getToken(): string {
  const token = process.env.INEGI_DENUE_TOKEN;
  if (!token) {
    throw new Error(
      "Falta la variable de entorno INEGI_DENUE_TOKEN. Consigue un token gratuito registrandote en https://www.inegi.org.mx/servicios/api_denue.html (el mismo token funciona para DENUE e Indicadores)."
    );
  }
  return token;
}

export interface Observacion {
  periodo: string;
  valor: string;
}

async function consultar(codigo: string, areaGeografica: string, soloUltimoDato: boolean, banco: string): Promise<Observacion[]> {
  const token = getToken();
  const url = `${BASE_URL}/${codigo}/es/${areaGeografica}/${soloUltimoDato}/${banco}/2.0/${token}?type=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`INEGI respondio con estado ${res.status}: ${await res.text()}`);
  }
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`No se pudo interpretar la respuesta de INEGI como JSON: ${text.slice(0, 300)}`);
  }
  if (Array.isArray(data)) {
    // Las respuestas de error vienen como ["ErrorInfo:...", "ErrorDetails:...", "ErrorCode:N"]
    const errorCode = data.find((line) => typeof line === "string" && line.startsWith("ErrorCode:"));
    if (errorCode === "ErrorCode:100") {
      return []; // senal para que obtenerIndicador() reintente con el otro banco
    }
    throw new Error(`INEGI respondio con error: ${data.join(" / ")}`);
  }
  const series = (data as { Series?: Array<{ OBSERVATIONS?: Array<{ TIME_PERIOD: string; OBS_VALUE: string }> }> }).Series;
  if (!series || series.length === 0) return [];
  return series[0].OBSERVATIONS?.map((o) => ({ periodo: o.TIME_PERIOD, valor: o.OBS_VALUE })) ?? [];
}

export async function obtenerIndicador(
  codigo: string,
  areaGeografica: string,
  soloUltimoDato: boolean,
  bancoPreferido: "BISE" | "BIE-BISE" = "BIE-BISE"
): Promise<Observacion[]> {
  const resultado = await consultar(codigo, areaGeografica, soloUltimoDato, bancoPreferido);
  if (resultado.length > 0) return resultado;
  const otroBanco = bancoPreferido === "BIE-BISE" ? "BISE" : "BIE-BISE";
  return consultar(codigo, areaGeografica, soloUltimoDato, otroBanco);
}
