/**
 * Aro que sigue al mouse. Se mueve en cada cuadro, acercándose a la posición
 * real un poco cada vez (por eso llega con retraso). Se esconde cuando hay un detalle abierto:
 * el `<dialog>` va en la capa superior y el aro quedaría debajo.
 */
const SELECTOR_TOCABLE = "a, button, [role='button'], label, summary, [data-galeria]";
const SUAVIDAD = 0.2;

const aro = document.querySelector<HTMLElement>("[data-cursor]");
const conMouse = matchMedia("(hover: hover) and (pointer: fine)");
const reducido = matchMedia("(prefers-reduced-motion: reduce)");

if (aro && conMouse.matches && !reducido.matches) {
  let x = -100;
  let y = -100;
  let destinoX = x;
  let destinoY = y;
  let cuadro: number | undefined;

  const mover = () => {
    x += (destinoX - x) * SUAVIDAD;
    y += (destinoY - y) * SUAVIDAD;
    // `translate` y no `transform`: así el `scale` del CSS no multiplica el desplazamiento.
    aro.style.translate = `${x}px ${y}px`;
    cuadro = Math.hypot(destinoX - x, destinoY - y) > 0.1 ? requestAnimationFrame(mover) : undefined;
  };

  document.addEventListener("pointermove", (evento) => {
    if (evento.pointerType !== "mouse") return;
    destinoX = evento.clientX;
    destinoY = evento.clientY;
    // La primera vez aparece donde está el mouse, sin viajar desde la esquina.
    if (!aro.classList.contains("visible")) {
      x = destinoX;
      y = destinoY;
    }
    const target = evento.target as HTMLElement;
    aro.classList.toggle("visible", !document.querySelector("dialog[open]"));
    aro.classList.toggle("sobre", Boolean(target.closest?.(SELECTOR_TOCABLE)));
    cuadro ??= requestAnimationFrame(mover);
  });

  document.addEventListener("pointerdown", () => aro.classList.add("presionado"));
  document.addEventListener("pointerup", () => aro.classList.remove("presionado"));
  document.documentElement.addEventListener("pointerleave", () => aro.classList.remove("visible"));
}
