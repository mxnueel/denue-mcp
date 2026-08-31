#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buscarCercania, buscarPorEstado, buscarPorNombre, obtenerFicha, type Establecimiento } from "./denue.js";
import { resolveEstadoCode } from "./estados.js";
import { resolveIndicador, obtenerIndicador, INDICADORES_CATALOGO } from "./indicadores.js";

const server = new McpServer({
  name: "denue-mcp",
  version: "1.0.0",
});

function resumen(establecimientos: Establecimiento[]): string {
  if (establecimientos.length === 0) {
    return "No se encontraron establecimientos con esos criterios.";
  }
  return establecimientos
    .map((e) => {
      const ubicacion = e.Ubicacion.replace(/\s+/g, " ").trim();
      const direccion = [e.Tipo_vialidad, e.Calle, e.Num_Exterior, e.Colonia, e.CP, ubicacion]
        .filter(Boolean)
        .join(" ");
      return `- ${e.Nombre.trim()} (id: ${e.Id})\n  Actividad: ${e.Clase_actividad}\n  Direccion: ${direccion}\n  Telefono: ${e.Telefono || "N/D"}\n  Coordenadas: ${e.Latitud}, ${e.Longitud}`;
    })
    .join("\n\n");
}

server.registerTool(
  "denue_buscar_cercania",
  {
    title: "Buscar negocios cerca de una coordenada",
    description:
      "Busca establecimientos economicos de todo Mexico en el Directorio Estadistico Nacional de Unidades Economicas (DENUE) de INEGI, cerca de una coordenada dada. Util para encontrar negocios, competidores o proveedores en una zona especifica.",
    inputSchema: {
      condicion: z.string().describe("Palabra clave a buscar, por ejemplo 'restaurante', 'farmacia', 'oxxo'"),
      latitud: z.number().describe("Latitud del punto de busqueda"),
      longitud: z.number().describe("Longitud del punto de busqueda"),
      distanciaMetros: z.number().min(1).max(5000).default(1000).describe("Radio de busqueda en metros (maximo 5000)"),
    },
  },
  async ({ condicion, latitud, longitud, distanciaMetros }) => {
    const resultados = await buscarCercania(condicion, latitud, longitud, distanciaMetros);
    return { content: [{ type: "text", text: resumen(resultados) }] };
  }
);

server.registerTool(
  "denue_buscar_por_estado",
  {
    title: "Buscar negocios en un estado de Mexico",
    description:
      "Busca establecimientos economicos por palabra clave dentro de un estado especifico de Mexico (o a nivel nacional). Util cuando no se tiene una coordenada exacta, solo una region.",
    inputSchema: {
      condicion: z.string().describe("Palabra clave a buscar, por ejemplo 'panaderia', 'taller mecanico'"),
      estado: z.string().describe("Nombre del estado (ej. 'Jalisco', 'Ciudad de Mexico') o codigo de dos digitos (01-32). Usa 'nacional' para buscar en todo Mexico."),
      inicio: z.number().int().min(1).default(1).describe("Numero de registro inicial (para paginar resultados)"),
      fin: z.number().int().min(1).max(100).default(20).describe("Numero de registro final (maximo 100 por consulta)"),
    },
  },
  async ({ condicion, estado, inicio, fin }) => {
    const codigo = resolveEstadoCode(estado);
    const resultados = await buscarPorEstado(condicion, codigo, inicio, fin);
    return { content: [{ type: "text", text: resumen(resultados) }] };
  }
);

server.registerTool(
  "denue_buscar_por_nombre",
  {
    title: "Buscar un negocio por nombre o razon social",
    description:
      "Busca establecimientos economicos por su nombre comercial o razon social en todo Mexico o en un estado especifico.",
    inputSchema: {
      nombre: z.string().describe("Nombre comercial o razon social a buscar"),
      estado: z.string().default("nacional").describe("Nombre del estado o codigo de dos digitos. Por defecto busca a nivel nacional."),
      inicio: z.number().int().min(1).default(1),
      fin: z.number().int().min(1).max(100).default(20),
    },
  },
  async ({ nombre, estado, inicio, fin }) => {
    const codigo = resolveEstadoCode(estado);
    const resultados = await buscarPorNombre(nombre, codigo, inicio, fin);
    return { content: [{ type: "text", text: resumen(resultados) }] };
  }
);

server.registerTool(
  "denue_detalle",
  {
    title: "Obtener el detalle completo de un establecimiento",
    description: "Obtiene la ficha completa de un establecimiento economico dado su ID de DENUE (obtenido de otra busqueda).",
    inputSchema: {
      id: z.string().describe("ID del establecimiento en DENUE"),
    },
  },
  async ({ id }) => {
    const resultados = await obtenerFicha(id);
    return { content: [{ type: "text", text: resumen(resultados) }] };
  }
);

server.registerTool(
  "inegi_indicador",
  {
    title: "Consultar un indicador socioeconomico de INEGI",
    description:
      `Consulta indicadores socioeconomicos oficiales de INEGI (Banco de Indicadores): poblacion, inflacion, confianza del consumidor, actividad industrial, y mas, a nivel nacional o por estado. Indicadores conocidos por nombre: ${Object.keys(INDICADORES_CATALOGO).join(", ")}. Tambien acepta directamente un codigo numerico de indicador de INEGI para consultar cualquiera de su catalogo.`,
    inputSchema: {
      indicador: z.string().describe("Nombre del indicador (ej. 'poblacion', 'inflacion') o codigo numerico de INEGI"),
      estado: z.string().default("nacional").describe("Nombre del estado (ej. 'Jalisco') o 'nacional' para todo el pais"),
      historico: z.boolean().default(false).describe("Si es true, regresa toda la serie historica disponible en vez de solo el dato mas reciente"),
    },
  },
  async ({ indicador, estado, historico }) => {
    const catalogado = resolveIndicador(indicador);
    const areaGeografica = estado.trim().toLowerCase() === "nacional" ? "00" : resolveEstadoCode(estado);
    const observaciones = await obtenerIndicador(catalogado.codigo, areaGeografica, !historico, catalogado.banco);
    if (observaciones.length === 0) {
      return { content: [{ type: "text", text: `No se encontraron datos para "${indicador}" en "${estado}".` }] };
    }
    const LIMITE_HISTORICO = 24;
    const truncado = observaciones.length > LIMITE_HISTORICO;
    const mostrar = truncado ? observaciones.slice(0, LIMITE_HISTORICO) : observaciones;
    const formatoValor = (v: string) => {
      const num = Number(v);
      return Number.isFinite(num) ? num.toLocaleString("es-MX", { maximumFractionDigits: 2 }) : v;
    };
    const lineas = [
      `${catalogado.descripcion} (codigo ${catalogado.codigo}) — ${estado}:`,
      ...mostrar.map((o) => `- ${o.periodo}: ${formatoValor(o.valor)}`),
    ];
    if (truncado) {
      lineas.push(`... (${observaciones.length - LIMITE_HISTORICO} periodos mas omitidos, mostrando los ${LIMITE_HISTORICO} mas recientes)`);
    }
    return { content: [{ type: "text", text: lineas.join("\n") }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("denue-mcp corriendo por stdio");
}

main().catch((err) => {
  console.error("Error fatal en denue-mcp:", err);
  process.exit(1);
});
