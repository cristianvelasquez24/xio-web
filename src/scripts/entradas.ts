/**
 * Entradas al hacer scroll: cada elemento con `data-entra` aparece una sola vez cuando
 * entra en pantalla. Los que entran a la vez (una fila de tarjetas) se escalonan.
 * El estado oculto solo existe en CSS bajo `.js` y sin movimiento reducido.
 */
const elementos = document.querySelectorAll<HTMLElement>("[data-entra]");
const ESCALON_MS = 70;

if (!("IntersectionObserver" in window)) {
  elementos.forEach((el) => el.classList.add("entro"));
} else {
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas
        .filter((e) => e.isIntersecting)
        .forEach((e, i) => {
          const el = e.target as HTMLElement;
          // Un retraso fijo en el HTML (data-entra="200") manda sobre el escalonado.
          const fijo = Number(el.dataset.entra);
          el.style.setProperty("--retraso", `${fijo > 0 ? fijo : i * ESCALON_MS}ms`);
          el.classList.add("entro");
          observador.unobserve(el);
        });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  );
  elementos.forEach((el) => observador.observe(el));
}
