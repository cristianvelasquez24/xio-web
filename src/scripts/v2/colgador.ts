/**
 * V2 · Colgador.
 * - Péndulo: cada prenda tiene un ángulo y una velocidad; un resorte amortiguado la lleva
 *   de vuelta al reposo. Deslizar el riel, hacer scroll en la página o pasar el mouse por
 *   encima le da un empujón.
 * - Toque: el primero gira la prenda y la marca; el segundo abre el detalle
 *   (lo hace `abrir-producto.ts`, que escucha los `data-abrir-producto`).
 * - Con el mouse, el riel también se arrastra (en el celular el scroll es nativo).
 * Con movimiento reducido no hay péndulo ni giro: un toque abre el detalle.
 */
const RESORTE = 38; // rigidez: más alto, oscila más rápido
const AMORTIGUACION = 3.2; // más alto, se detiene antes
const ANGULO_MAX = 14; // grados
const QUIETO = 0.02;

interface Pendulo {
  el: HTMLElement;
  angulo: number;
  velocidad: number;
}

const seccion = document.querySelector<HTMLElement>("[data-colgador]");
if (seccion) iniciar(seccion);

function iniciar(seccion: HTMLElement) {
  const riel = seccion.querySelector<HTMLElement>("[data-riel]")!;
  const progreso = seccion.querySelector<HTMLElement>("[data-progreso]");
  const perchas = [...seccion.querySelectorAll<HTMLElement>("[data-percha]")];
  const reducido = matchMedia("(prefers-reduced-motion: reduce)");
  const pendulos: Pendulo[] = perchas.map((el) => ({ el, angulo: 0, velocidad: 0 }));

  /* ---------- Péndulos ---------- */
  let animando = 0;
  let ultimo = 0;
  let visible = true;

  function empujar(p: Pendulo, fuerza: number) {
    if (reducido.matches || !visible) return;
    p.velocidad += fuerza;
    if (!animando) {
      ultimo = 0;
      animando = requestAnimationFrame(paso);
    }
  }

  function paso(t: number) {
    const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 1 / 60;
    ultimo = t;
    let vivo = false;
    for (const p of pendulos) {
      if (Math.abs(p.angulo) < QUIETO && Math.abs(p.velocidad) < QUIETO * 4) {
        if (p.angulo !== 0) {
          p.angulo = p.velocidad = 0;
          p.el.style.removeProperty("--sw");
        }
        continue;
      }
      // Euler semi-implícito en dos sub-pasos: estable aunque baje la tasa de cuadros.
      for (let i = 0; i < 2; i++) {
        p.velocidad += (-RESORTE * p.angulo - AMORTIGUACION * p.velocidad) * (dt / 2);
        p.angulo += p.velocidad * (dt / 2);
      }
      if (Math.abs(p.angulo) > ANGULO_MAX) {
        p.angulo = Math.sign(p.angulo) * ANGULO_MAX;
        p.velocidad *= -0.35;
      }
      p.el.style.setProperty("--sw", `${p.angulo.toFixed(2)}deg`);
      vivo = true;
    }
    animando = vivo ? requestAnimationFrame(paso) : 0;
  }

  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(seccion);

  /** Empuja a todas las prendas visibles; cada una un poco distinta para que no se muevan en bloque. */
  function brisa(velocidad: number) {
    const ancho = innerWidth;
    pendulos.forEach((p, i) => {
      const r = p.el.getBoundingClientRect();
      if (r.right < 0 || r.left > ancho) return;
      empujar(p, velocidad * (i % 2 ? 1 : 0.8) * (0.8 + (i % 3) * 0.15));
    });
  }

  // Deslizar el riel: las prendas se quedan atrás, como si colgaran de verdad.
  let xAnterior = riel.scrollLeft;
  let tAnterior = performance.now();
  riel.addEventListener(
    "scroll",
    () => {
      const t = performance.now();
      const dx = riel.scrollLeft - xAnterior;
      const dt = Math.max(16, t - tAnterior);
      xAnterior = riel.scrollLeft;
      tAnterior = t;
      brisa(Math.max(-40, Math.min(40, (dx / dt) * 22)));
      pintarProgreso();
    },
    { passive: true },
  );

  // Scroll de la página: una brisa suave.
  let yAnterior = scrollY;
  let tScroll = 0;
  addEventListener(
    "scroll",
    () => {
      const t = performance.now();
      if (t - tScroll < 90) return;
      const dy = scrollY - yAnterior;
      const dt = t - tScroll;
      yAnterior = scrollY;
      tScroll = t;
      if (dt < 400 && dy) brisa(Math.max(-24, Math.min(24, (dy / dt) * 10)));
    },
    { passive: true },
  );

  // Mouse por encima: empuja la prenda en la dirección del movimiento.
  pendulos.forEach((p) => {
    p.el.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse" && !arrastre) empujar(p, Math.max(-30, Math.min(30, e.movementX * 1.6)));
    });
  });

  /* ---------- Indicador de posición ---------- */
  function pintarProgreso() {
    if (!progreso) return;
    const visibleFrac = riel.clientWidth / riel.scrollWidth;
    const recorrido = riel.scrollWidth - riel.clientWidth;
    const avance = recorrido > 0 ? riel.scrollLeft / recorrido : 0;
    progreso.style.setProperty("--ancho", `${Math.max(12, visibleFrac * 100)}%`);
    progreso.style.setProperty("--x", `${avance * (1 / Math.max(0.12, visibleFrac) - 1) * 100}%`);
  }
  pintarProgreso();
  addEventListener("resize", pintarProgreso, { passive: true });

  /* ---------- Arrastre con mouse (con inercia) ---------- */
  let arrastre: { x: number; scroll: number; movido: boolean; v: number; t: number } | null = null;
  let evitarClic = false;

  // Sin esto el navegador arrastra el enlace o la imagen en vez del riel.
  riel.addEventListener("dragstart", (e) => e.preventDefault());

  riel.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    arrastre = { x: e.clientX, scroll: riel.scrollLeft, movido: false, v: 0, t: e.timeStamp };
  });

  addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x;
    if (!arrastre.movido && Math.abs(dx) < 6) return;
    if (!arrastre.movido) {
      arrastre.movido = true;
      riel.classList.add("arrastrando");
    }
    const anterior = riel.scrollLeft;
    riel.scrollLeft = arrastre.scroll - dx;
    const dt = Math.max(1, e.timeStamp - arrastre.t);
    arrastre.v = (riel.scrollLeft - anterior) / dt;
    arrastre.t = e.timeStamp;
  });

  addEventListener("pointerup", () => {
    if (!arrastre) return;
    const { movido, v } = arrastre;
    arrastre = null;
    riel.classList.remove("arrastrando");
    if (!movido) return;
    evitarClic = true;
    setTimeout(() => (evitarClic = false), 0);
    if (!reducido.matches) inercia(v * 16);
  });

  function inercia(velocidad: number) {
    if (Math.abs(velocidad) < 0.5) return;
    riel.scrollLeft += velocidad;
    requestAnimationFrame(() => inercia(velocidad * 0.93));
  }

  /* ---------- Toque: girar, y después abrir ---------- */
  let elegida: HTMLElement | null = null;

  perchas.forEach((percha, i) => {
    percha.addEventListener("click", (e) => {
      if (evitarClic) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Segundo toque (o sin animaciones): deja pasar el clic y se abre el detalle.
      if (reducido.matches || percha === elegida) return;

      e.preventDefault();
      e.stopPropagation();
      elegida?.removeAttribute("aria-current");
      elegida = percha;
      percha.setAttribute("aria-current", "true");
      percha.closest("li")?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

      percha.classList.remove("girando");
      void percha.offsetWidth; // reinicia la animación si ya había girado
      percha.classList.add("girando");
      empujar(pendulos[i], 26);
    });
    percha.addEventListener("animationend", () => percha.classList.remove("girando"));
  });

  // Al volver del detalle se puede girar otra prenda desde cero.
  addEventListener("hashchange", () => {
    if (!location.hash.startsWith("#producto-")) {
      elegida?.removeAttribute("aria-current");
      elegida = null;
    }
  });

  // Entrada: cuando terminan de colgarse, un pequeño vaivén.
  setTimeout(() => brisa(18), 700);
}

export {};
