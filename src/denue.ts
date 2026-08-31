const BASE_URL = "https://www.inegi.org.mx/app/api/denue/v1/consulta";

export interface Establecimiento {
  CLEE: string;
  Id: string;
  Nombre: string;
  Razon_social: string;
  Clase_actividad: string;
  Estrato: string;
  Tipo_vialidad: string;
  Calle: string;
  Num_Exterior: string;
  Num_Interior: string;
  Colonia: string;
  CP: string;
  /** Localidad, municipio y estado juntos en un solo string, ej. "GUADALAJARA   , Guadalajara, JALISCO" */
  Ubicacion: string;
  Telefono: string;
  Correo_e: string;
  Sitio_internet: string;
  Tipo: string;
  Longitud: string;
  Latitud: string;
}

function getToken(): string {
  const token = process.env.INEGI_DENUE_TOKEN;
  if (!token) {
    throw new Error(
      "Falta la variable de entorno INEGI_DENUE_TOKEN. Consigue un token gratuito registrandote en https://www.inegi.org.mx/servicios/api_denue.html"
    );
  }
  return token;
}

async function fetchDenue(path: string): Promise<unknown> {
  const url = `${BASE_URL}/${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`DENUE respondio con estado ${res.status}: ${await res.text()}`);
  }
  const text = await res.text();
  if (!text || text.trim() === "") {
    return [];
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`No se pudo interpretar la respuesta de DENUE como JSON: ${text.slice(0, 300)}`);
  }
}

export async function buscarCercania(condicion: string, latitud: number, longitud: number, distanciaMetros: number): Promise<Establecimiento[]> {
  const token = getToken();
  const distancia = Math.min(Math.max(distanciaMetros, 0), 5000);
  const path = `Buscar/${encodeURIComponent(condicion)}/${latitud},${longitud}/${distancia}/${token}`;
  return (await fetchDenue(path)) as Establecimiento[];
}

export async function buscarPorEstado(condicion: string, entidadCodigo: string, inicio = 1, fin = 20): Promise<Establecimiento[]> {
  const token = getToken();
  const path = `BuscarEntidad/${encodeURIComponent(condicion)}/${entidadCodigo}/${inicio}/${fin}/${token}`;
  return (await fetchDenue(path)) as Establecimiento[];
}

export async function buscarPorNombre(nombre: string, entidadCodigo = "00", inicio = 1, fin = 20): Promise<Establecimiento[]> {
  const token = getToken();
  const path = `Nombre/${encodeURIComponent(nombre)}/${entidadCodigo}/${inicio}/${fin}/${token}`;
  return (await fetchDenue(path)) as Establecimiento[];
}

export async function obtenerFicha(id: string): Promise<Establecimiento[]> {
  const token = getToken();
  const path = `Ficha/${encodeURIComponent(id)}/${token}`;
  return (await fetchDenue(path)) as Establecimiento[];
}
