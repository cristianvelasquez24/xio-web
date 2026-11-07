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
    /** Frase que acompaña a la marca en la portada: dice qué es XIO. */
    frase: "Ropa deportiva y casual de marca, para mujer y hombre.",
    /** Prendas (por id) que rotan en la foto principal de la portada, en este orden. */
    carrusel: [
      "us-polo-negra",
      "bralette-negro-victoria",
      "short-pijama-negro-victoria",
      "sudadera-verde-adidad-mujer",
      "licra-corta-verde-under-armour",
      "polo-golf-blanco-rayas-adidas",
    ],
    /** Tiempo que se ve cada foto del carrusel, en milisegundos. */
    intervaloCarrusel: 2000,
    /** Marcas que se nombran en la portada. Mantener al día con el catálogo. */
    marcas: ["Under Armour", "adidas", "Nike", "Tommy Hilfiger", "Victoria's Secret"],
  },
};
