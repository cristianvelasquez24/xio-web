/**
 * Enlaces a una prenda fuera del catálogo (portada, "Una pieza, una talla"): abren su detalle
 * como si se tocara la tarjeta. Sin JavaScript, el enlace `#producto-<id>` baja a la tarjeta.
 */
document.addEventListener("click", (evento) => {
  const enlace = (evento.target as HTMLElement).closest<HTMLElement>("[data-abrir-producto]");
  if (!enlace || evento.metaKey || evento.ctrlKey || evento.shiftKey) return;
  const id = CSS.escape(enlace.dataset.abrirProducto ?? "");
  const boton = document.querySelector<HTMLButtonElement>(`[data-producto][data-id="${id}"] [data-abrir-detalle]`);
  if (!boton) return;
  evento.preventDefault();
  boton.click();
});
