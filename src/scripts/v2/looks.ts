/**
 * V2 · Pasarela de looks. En cada scroll calcula qué tan lejos del centro está cada look
 * (`--d`, en anchos de look) para que el CSS lo achique y desenfoque, marca el del centro
 * como activo y muestra su ficha. Con el mouse, la pasarela también se arrastra.
 */
const seccion = document.querySelector<HTMLElement>("[data-looks]");
if (seccion) iniciar(seccion);

function iniciar(seccion: HTMLElement) {
  const pasarela = seccion.querySelector<HTMLElement>("[data-pasarela]")!;
  const looks = [...pasarela.querySelectorAll<HTMLElement>("[data-look]")];
  const fichas = [...seccion.querySelectorAll<HTMLElement>("[data-ficha]")];
  const progreso = seccion.querySelector<HTMLElement>("[data-progreso]");
  let activo = -1;
  let pendiente = 0;

  function medir() {
    pendiente = 0;
    const centro = pasarela.scrollLeft + pasarela.clientWidth / 2;
    let cercano = 0;
    let menor = Infinity;
    looks.forEach((look, i) => {
      const d = Math.abs(look.offsetLeft + look.offsetWidth / 2 - centro) / (look.offsetWidth || 1);
      look.style.setProperty("--d", d.toFixed(3));
      if (d < menor) {
        menor = d;
        cercano = i;
      }
    });
    if (cercano !== activo) {
      looks[activo]?.classList.remove("activo");
      looks[cercano].classList.add("activo");
      fichas.forEach((f, i) => (f.hidden = i !== cercano));
      activo = cercano;
    }
    if (progreso) {
      const frac = 1 / looks.length;
      progreso.style.setProperty("--ancho", `${frac * 100}%`);
      progreso.style.setProperty("--x", `${activo * 100}%`);
    }
  }

  const programar = () => (pendiente ||= requestAnimationFrame(medir));
  pasarela.addEventListener("scroll", programar, { passive: true });
  addEventListener("resize", programar, { passive: true });
  medir();

  // Tocar un look de los lados lo trae al centro en vez de abrirlo.
  looks.forEach((look, i) => {
    look.addEventListener(
      "click",
      (e) => {
        if (i === activo) return;
        e.preventDefault();
        e.stopPropagation();
        look.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      },
      true,
    );
  });

  /* Arrastre con mouse. */
  let arrastre: { x: number; scroll: number; movido: boolean } | null = null;
  let evitarClic = false;
  // Soltar un arrastre no cuenta como clic sobre un look.
  pasarela.addEventListener(
    "click",
    (e) => {
      if (evitarClic) (e.preventDefault(), e.stopPropagation());
    },
    true,
  );
  pasarela.addEventListener("dragstart", (e) => e.preventDefault());
  pasarela.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button === 0) arrastre = { x: e.clientX, scroll: pasarela.scrollLeft, movido: false };
  });
  addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x;
    if (!arrastre.movido && Math.abs(dx) < 6) return;
    arrastre.movido = true;
    pasarela.style.scrollSnapType = "none";
    pasarela.scrollLeft = arrastre.scroll - dx;
  });
  addEventListener("pointerup", () => {
    if (!arrastre) return;
    const movido = arrastre.movido;
    arrastre = null;
    if (!movido) return;
    pasarela.style.removeProperty("scroll-snap-type");
    evitarClic = true;
    setTimeout(() => (evitarClic = false), 0);
    looks[activo]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });
}

export {};
