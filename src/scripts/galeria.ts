/**
 * Galerías de las tarjetas con varias fotos: el deslizamiento es CSS (scroll-snap);
 * aquí solo se sincronizan los puntos y se permite saltar a una foto con ellos.
 */
for (const galeria of document.querySelectorAll<HTMLElement>("[data-galeria]")) {
  const puntos = [...(galeria.parentElement?.querySelectorAll<HTMLButtonElement>("[data-punto]") ?? [])];
  if (puntos.length === 0) continue;

  const marcar = () => {
    const actual = Math.round(galeria.scrollLeft / galeria.clientWidth);
    puntos.forEach((p, i) => (i === actual ? p.setAttribute("aria-current", "true") : p.removeAttribute("aria-current")));
  };

  galeria.addEventListener("scroll", marcar, { passive: true });

  for (const punto of puntos) {
    punto.addEventListener("click", () => {
      const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      galeria.scrollTo({ left: Number(punto.dataset.punto) * galeria.clientWidth, behavior: suave ? "smooth" : "auto" });
    });
  }
}
