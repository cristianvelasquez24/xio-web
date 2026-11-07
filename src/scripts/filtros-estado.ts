/**
 * Definición de los filtros, compartida entre el HTML (Filtros.astro) y el script del navegador.
 * El primer valor de cada filtro es el valor por defecto y no se escribe en la URL.
 * Las opciones de talla salen de los datos (Filtros.astro las genera en build); el navegador
 * las lee de los chips del HTML.
 */
export const FILTROS = [
  {
    clave: "genero",
    etiqueta: "Género",
    opciones: [
      { valor: "todos", texto: "Todos" },
      { valor: "mujer", texto: "Mujer" },
      { valor: "hombre", texto: "Hombre" },
    ],
  },
  {
    clave: "linea",
    etiqueta: "Línea",
    opciones: [
      { valor: "todo", texto: "Todo" },
      { valor: "sport", texto: "Sport" },
      { valor: "casual", texto: "Casual" },
      { valor: "bolsos", texto: "Bolsos" },
      { valor: "beauty", texto: "Beauty" },
    ],
  },
] as const;

/** Valor por defecto de cada filtro (no se escribe en la URL). */
export const DEFECTO = { genero: "todos", linea: "todo", talla: "todas" } as const;

export type ClaveFiltro = keyof typeof DEFECTO;
export type Estado = Record<ClaveFiltro, string>;
/** Valores válidos de cada filtro (en el navegador se leen de los chips). */
export type Validos = Partial<Record<ClaveFiltro, readonly string[]>>;

const CLAVES = Object.keys(DEFECTO) as ClaveFiltro[];

export function estadoPorDefecto(): Estado {
  return { ...DEFECTO };
}

/** Lee el estado de la URL. Valores desconocidos o ausentes vuelven al valor por defecto. */
export function leerEstado(busqueda: string, validos: Validos): Estado {
  const params = new URLSearchParams(busqueda);
  const estado = estadoPorDefecto();
  for (const clave of CLAVES) {
    const valor = params.get(clave);
    if (valor !== null && validos[clave]?.includes(valor)) estado[clave] = valor;
  }
  return estado;
}

/** Escribe el estado como query string, omitiendo los valores por defecto. */
export function escribirEstado(estado: Estado): string {
  const params = new URLSearchParams();
  for (const clave of CLAVES) {
    if (estado[clave] !== DEFECTO[clave]) params.set(clave, estado[clave]);
  }
  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

/** Las prendas unisex aparecen tanto en Mujer como en Hombre. */
export function coincide(estado: Estado, genero: string, linea: string, tallas: readonly string[]): boolean {
  const okGenero = estado.genero === "todos" || genero === estado.genero || genero === "unisex";
  const okLinea = estado.linea === "todo" || linea === estado.linea;
  const okTalla = estado.talla === "todas" || tallas.includes(estado.talla);
  return okGenero && okLinea && okTalla;
}
