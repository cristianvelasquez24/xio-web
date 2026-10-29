/**
 * Vitrina circular: mueve las fotos entre las posiciones activa / anterior / siguiente / oculta.
 * Avanza sola cada `INTERVALO_MS` mientras se ve en pantalla; deja de hacerlo para siempre en cuanto
 * la persona la usa (flechas, dedo o teclado). Con movimiento reducido no avanza sola.
 */
const INTERVALO_MS = 5000;
const UMBRAL_DESLIZAR_PX = 40;

const vitrina = document.querySelector<HTMLElement>("[data-vitrina]");

if (vitrina) {
  const pila = vitrina.querySelector<HTMLElement>("[data-pila]")!;
  const fotos = [...vitrina.querySelectorAll<HTMLElement>("[data-diapositiva]")];
  const fichas = [...vitrina.querySelectorAll<HTMLElement>("[data-ficha]")];
  const textos = vitrina.querySelector<HTMLElement>("[data-textos]")!;
  const cuenta = vitrina.querySelector<HTMLElement>("[data-cuenta]")!;
  const reducido = matchMedia("(prefers-reduced-motion: reduce)");
  const n = fotos.length;
  let actual = 0;

  const dosCifras = (x: number) => String(x).padStart(2, "0");

  const mostrar = (indice: number, animar = true) => {
    actual = (indice + n) % n;
    fotos.forEach((foto, i) => {
      const d = (i - actual + n) % n;
      const pos = d === 0 ? "activa" : d === 1 ? "siguiente" : d === n - 1 ? "anterior" : "oculta";
      foto.dataset.pos = pos;
      foto.hidden = false;
      // Solo la activa se anuncia y recibe el foco; las vecinas se tocan para traerlas al frente.
      foto.setAttribute("aria-hidden", String(pos !== "activa"));
      foto.tabIndex = pos === "activa" ? 0 : -1;
    });
    fichas.forEach((ficha, i) => {
      ficha.hidden = i !== actual;
      ficha.classList.remove("entra");
    });
    if (animar) {
      // Fuerza un nuevo cuadro para que la animación de entrada se repita en cada cambio.
      void fichas[actual].offsetWidth;
      fichas[actual].classList.add("entra");
    }
    cuenta.textContent = `${dosCifras(actual + 1)} / ${dosCifras(n)}`;
  };

  // --- Avance automático ---
  let temporizador: number | undefined;
  let tocada = false;
  let visible = false;

  const detener = () => {
    clearInterval(temporizador);
    temporizador = undefined;
  };

  const programar = () => {
    detener();
    if (tocada || !visible || reducido.matches || document.hidden) return;
    temporizador = window.setInterval(() => mostrar(actual + 1), INTERVALO_MS);
  };

  const usar = (indice: number) => {
    tocada = true;
    detener();
    // A partir de aquí la persona manda: se anuncia cada cambio.
    textos.setAttribute("aria-live", "polite");
    mostrar(indice);
  };

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    programar();
  }, { threshold: 0.4 }).observe(vitrina);
  document.addEventListener("visibilitychange", programar);
  vitrina.addEventListener("pointerenter", detener);
  vitrina.addEventListener("pointerleave", programar);
  vitrina.addEventListener("focusin", detener);

  // --- Controles ---
  vitrina.querySelector("[data-anterior]")!.addEventListener("click", () => usar(actual - 1));
  vitrina.querySelector("[data-siguiente]")!.addEventListener("click", () => usar(actual + 1));

  vitrina.addEventListener("keydown", (evento) => {
    if (evento.key === "ArrowLeft") usar(actual - 1);
    else if (evento.key === "ArrowRight") usar(actual + 1);
  });

  // Deslizar con el dedo o el mouse.
  let inicioX: number | null = null;
  let deslizo = false;
  pila.addEventListener("pointerdown", (evento) => {
    inicioX = evento.clientX;
    deslizo = false;
  });
  pila.addEventListener("pointerup", (evento) => {
    if (inicioX === null) return;
    const dx = evento.clientX - inicioX;
    inicioX = null;
    if (Math.abs(dx) < UMBRAL_DESLIZAR_PX) return;
    deslizo = true;
    usar(dx < 0 ? actual + 1 : actual - 1);
  });
  pila.addEventListener("pointercancel", () => (inicioX = null));

  // Tocar una vecina la trae al frente; tocar la activa abre su detalle (scripts/abrir-producto).
  pila.addEventListener("click", (evento) => {
    const foto = (evento.target as HTMLElement).closest<HTMLElement>("[data-diapositiva]");
    if (!foto) return;
    if (deslizo || foto.dataset.pos !== "activa") {
      evento.preventDefault();
      evento.stopPropagation();
      if (!deslizo) usar(fotos.indexOf(foto));
    }
    deslizo = false;
  });
  // Arrastrar una foto no debe arrastrar el enlace ni la imagen.
  pila.addEventListener("dragstart", (evento) => evento.preventDefault());

  vitrina.querySelector<HTMLElement>("[data-controles]")!.hidden = false;
  mostrar(0, false);
}
