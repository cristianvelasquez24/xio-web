/**
 * V2 · Órbita. Las piezas viven sobre un círculo cuyo centro queda fuera del escenario,
 * a la derecha: solo se ve un arco. `posicion` es un número continuo (1.4 = entre la 2.ª
 * y la 3.ª pieza); cada pieza se ubica en el ángulo `FRENTE + (i - posicion) * PASO`.
 * Arrastrar la rueda o el escenario mueve `objetivo`; un muelle lleva `posicion` hacia él
 * y al soltar se encaja en la pieza más cercana.
 */
const FRENTE = 196; // grados: la pieza al frente queda a la izquierda, un poco arriba del centro
const PASO = 34; // grados entre piezas
const SUAVIDAD = 0.14; // fracción del camino que recorre por cuadro
const PX_POR_PIEZA = 90; // arrastre en la rueda para pasar a la siguiente

const seccion = document.querySelector<HTMLElement>("[data-orbita]");
if (seccion) iniciar(seccion);

function iniciar(seccion: HTMLElement) {
  const escenario = seccion.querySelector<HTMLElement>("[data-escenario]")!;
  const objetos = [...seccion.querySelectorAll<HTMLElement>("[data-objeto]")];
  const datos = [...seccion.querySelectorAll<HTMLElement>("[data-dato]")];
  const rueda = seccion.querySelector<HTMLElement>("[data-rueda]")!;
  const estrias = seccion.querySelector<HTMLElement>("[data-estrias]")!;
  const arco = seccion.querySelector<SVGCircleElement>("[data-arco]")!;
  const reducido = matchMedia("(prefers-reduced-motion: reduce)");
  const ultima = objetos.length - 1;
  const limitar = (v: number, min = 0, max = ultima) => Math.max(min, Math.min(max, v));

  let posicion = Number(seccion.dataset.inicial) || 0;
  let objetivo = posicion;
  let activo = -1;
  let cuadro = 0;
  let geo = { cx: 0, cy: 0, r: 0, tam: 0 };

  function medir() {
    const w = escenario.clientWidth;
    const h = escenario.clientHeight;
    const r = Math.min(w * 0.8, h * 0.8);
    // El centro se ubica para que la pieza al frente quede a ~32% del ancho.
    const rad = (FRENTE * Math.PI) / 180;
    geo = { cx: w * 0.34 - r * Math.cos(rad), cy: h * 0.5 - r * Math.sin(rad), r, tam: Math.min(w * 0.5, h * 0.55, 330) };
    arco.setAttribute("cx", String(geo.cx));
    arco.setAttribute("cy", String(geo.cy));
    arco.setAttribute("r", String(geo.r));
    escenario.style.setProperty("--tam", `${geo.tam}px`);
    pintar();
  }

  function pintar() {
    objetos.forEach((el, i) => {
      const k = i - posicion;
      const a = ((FRENTE - k * PASO) * Math.PI) / 180;
      const x = geo.cx + geo.r * Math.cos(a) - geo.tam / 2;
      const y = geo.cy + geo.r * Math.sin(a) - geo.tam / 2;
      const lejos = Math.abs(k);
      const escala = Math.max(0.32, 1 - lejos * 0.32);
      const giro = k * -10; // las piezas se inclinan siguiendo el arco
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${giro.toFixed(1)}deg) scale(${escala.toFixed(3)})`;
      el.style.opacity = String(Math.max(0, Math.min(1, 2.6 - lejos)));
      el.style.zIndex = String(100 - Math.round(lejos * 10));
      el.style.visibility = lejos > 2.7 ? "hidden" : "";
    });
    estrias.style.setProperty("--giro", `${(-posicion * PX_POR_PIEZA).toFixed(1)}px`);

    const cercano = Math.round(limitar(posicion));
    if (cercano !== activo) {
      datos.forEach((d, i) => (d.hidden = i !== cercano));
      objetos.forEach((o, i) => o.querySelector("a")?.setAttribute("tabindex", i === cercano ? "0" : "-1"));
      rueda.setAttribute("aria-valuenow", String(cercano + 1));
      rueda.setAttribute("aria-valuetext", datos[cercano]?.querySelector("h3")?.textContent ?? "");
      activo = cercano;
    }
  }

  function animar() {
    cuadro = 0;
    const d = objetivo - posicion;
    if (Math.abs(d) < 0.001 || reducido.matches) {
      posicion = objetivo;
      pintar();
      return;
    }
    posicion += d * SUAVIDAD;
    pintar();
    cuadro = requestAnimationFrame(animar);
  }

  function ir(nuevo: number) {
    objetivo = limitar(nuevo, -0.4, ultima + 0.4);
    if (!cuadro) cuadro = requestAnimationFrame(animar);
  }

  /* ---------- Arrastre (rueda y escenario) ---------- */
  let arrastre: { x: number; desde: number; escala: number; movido: boolean } | null = null;
  let evitarClic = false;

  function empezar(e: PointerEvent, escala: number) {
    if (e.button !== 0) return;
    arrastre = { x: e.clientX, desde: objetivo, escala, movido: false };
  }

  rueda.addEventListener("pointerdown", (e) => {
    empezar(e, PX_POR_PIEZA);
    rueda.setPointerCapture(e.pointerId);
  });
  escenario.addEventListener("pointerdown", (e) => empezar(e, escenario.clientWidth * 0.32));
  escenario.addEventListener("dragstart", (e) => e.preventDefault());

  addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x;
    if (!arrastre.movido && Math.abs(dx) < 6) return;
    if (!arrastre.movido) escenario.classList.add("arrastrando");
    arrastre.movido = true;
    ir(arrastre.desde - dx / arrastre.escala);
  });

  const soltar = () => {
    if (!arrastre) return;
    const movido = arrastre.movido;
    arrastre = null;
    escenario.classList.remove("arrastrando");
    ir(Math.round(limitar(objetivo)));
    if (movido) {
      evitarClic = true;
      setTimeout(() => (evitarClic = false), 0);
    }
  };
  addEventListener("pointerup", soltar);
  addEventListener("pointercancel", soltar);

  // En el escenario: soltar un arrastre no abre nada, y tocar una pieza de atrás la trae al frente.
  escenario.addEventListener(
    "click",
    (e) => {
      const objeto = (e.target as HTMLElement).closest<HTMLElement>("[data-objeto]");
      const i = objeto ? objetos.indexOf(objeto) : -1;
      if (evitarClic || (i >= 0 && i !== activo)) {
        e.preventDefault();
        e.stopPropagation();
        if (!evitarClic && i >= 0) ir(i);
      }
    },
    true,
  );

  rueda.addEventListener("keydown", (e) => {
    const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (paso) ir(Math.round(objetivo) + paso);
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(ultima);
    else return;
    e.preventDefault();
  });

  new ResizeObserver(medir).observe(escenario);
  medir();
}

export {};
