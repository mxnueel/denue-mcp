export const ESTADOS: Record<string, string> = {
  "aguascalientes": "01",
  "baja california": "02",
  "baja california sur": "03",
  "campeche": "04",
  "coahuila": "05",
  "colima": "06",
  "chiapas": "07",
  "chihuahua": "08",
  "ciudad de mexico": "09",
  "cdmx": "09",
  "durango": "10",
  "guanajuato": "11",
  "guerrero": "12",
  "hidalgo": "13",
  "jalisco": "14",
  "mexico": "15",
  "estado de mexico": "15",
  "michoacan": "16",
  "morelos": "17",
  "nayarit": "18",
  "nuevo leon": "19",
  "oaxaca": "20",
  "puebla": "21",
  "queretaro": "22",
  "quintana roo": "23",
  "san luis potosi": "24",
  "sinaloa": "25",
  "sonora": "26",
  "tabasco": "27",
  "tamaulipas": "28",
  "tlaxcala": "29",
  "veracruz": "30",
  "yucatan": "31",
  "zacatecas": "32",
  "nacional": "00",
  "todo mexico": "00",
  "todo el pais": "00",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export function resolveEstadoCode(input: string): string {
  const normalized = normalize(input);
  if (/^\d{1,2}$/.test(input.trim())) {
    return input.trim().padStart(2, "0");
  }
  const code = ESTADOS[normalized];
  if (!code) {
    const known = Object.keys(ESTADOS).join(", ");
    throw new Error(
      `Estado no reconocido: "${input}". Usa el nombre completo (ej. "Jalisco", "Ciudad de Mexico") o el código de dos dígitos (01-32, 00 para nacional). Estados conocidos: ${known}`
    );
  }
  return code;
}
