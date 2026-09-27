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
    alt: "Mujer caminando con bolsas de compras de marcas",
  },
};
