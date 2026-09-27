/**
 * Definición de los filtros, compartida entre el HTML (Filtros.astro) y el script del navegador.
 * El primer valor de cada filtro es el valor por defecto y no se escribe en la URL.
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
      { valor: "beauty", texto: "Beauty" },
    ],
  },
] as const;

export type ClaveFiltro = (typeof FILTROS)[number]["clave"];
export type Estado = Record<ClaveFiltro, string>;

export function estadoPorDefecto(): Estado {
  return Object.fromEntries(FILTROS.map((f) => [f.clave, f.opciones[0].valor])) as Estado;
}

/** Lee el estado de la URL. Valores desconocidos o ausentes vuelven al valor por defecto. */
export function leerEstado(busqueda: string): Estado {
  const params = new URLSearchParams(busqueda);
  const estado = estadoPorDefecto();
  for (const filtro of FILTROS) {
    const valor = params.get(filtro.clave);
    if (filtro.opciones.some((o) => o.valor === valor)) {
      estado[filtro.clave] = valor!;
    }
  }
  return estado;
}

/** Escribe el estado como query string, omitiendo los valores por defecto. */
export function escribirEstado(estado: Estado): string {
  const params = new URLSearchParams();
  for (const filtro of FILTROS) {
    if (estado[filtro.clave] !== filtro.opciones[0].valor) {
      params.set(filtro.clave, estado[filtro.clave]);
    }
  }
  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

/** Las prendas unisex aparecen tanto en Mujer como en Hombre. */
export function coincide(estado: Estado, genero: string, linea: string): boolean {
  const okGenero = estado.genero === "todos" || genero === estado.genero || genero === "unisex";
  const okLinea = estado.linea === "todo" || linea === estado.linea;
  return okGenero && okLinea;
}
