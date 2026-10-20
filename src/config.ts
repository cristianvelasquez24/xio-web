export const config = {
  /** Cambiar a `false` para quitar los precios de toda la web. */
  mostrarPrecio: true,

  /** Formato de precio. Provisional: pesos colombianos, confirmar con el dueño. */
  precio: {
    locale: "es-CO",
    moneda: "COP",
  },

  /** Línea breve bajo la marca en la portada (guiño a "Xio"). `null` = no se muestra. */
  lemaPortada: null as string | null,

  portada: {
    alt: "Mujer con gorra, top y sudadera rosados y bolso pequeño, echándose perfume",
    /** Frase que acompaña a la marca en la portada: dice qué es XIO. */
    frase: "Ropa deportiva y casual de marca, para mujer y hombre.",
    /** Marcas que se nombran en la portada. Mantener al día con el catálogo. */
    marcas: ["Under Armour", "adidas", "Nike", "Tommy Hilfiger", "Victoria's Secret"],
  },
};
