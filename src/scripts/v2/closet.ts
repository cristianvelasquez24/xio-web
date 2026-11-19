/**
 * V2 · Closet. Estado: el modelo elegido (mujer/hombre), la categoría de cada uno y la prenda
 * que lleva puesta. Tocar una tarjeta cambia la foto del modelo con un fundido; tocarla otra vez
 * vuelve al modelo base. Las fotos de la categoría a la vista se piden antes del toque.
 */
const seccion = document.querySelector<HTMLElement>("[data-closet]");
if (seccion) desplegable(seccion);

/**
 * El closet empieza oculto y se despliega con el botón "Closet" de la barra superior.
 * Se arma la primera vez que se abre: así sus fotos no se descargan si nadie lo abre.
 */
function desplegable(seccion: HTMLElement) {
  const boton = document.querySelector<HTMLButtonElement>("[data-abrir-closet]");
  let listo = false;

  function abrir(abierto: boolean) {
    seccion.hidden = !abierto;
    boton?.setAttribute("aria-expanded", String(abierto));
    if (!abierto) return;
    if (!listo) {
      iniciar(seccion);
      listo = true;
    }
    scrollTo({ top: 0, behavior: "smooth" });
  }

  if (boton) {
    boton.hidden = false;
    boton.addEventListener("click", () => abrir(seccion.hidden));
  }
  if (location.hash === "#closet") abrir(true);
}

function iniciar(seccion: HTMLElement) {
  const todos = <T extends HTMLElement>(sel: string) => [...seccion.querySelectorAll<T>(sel)];
  const carril = seccion.querySelector<HTMLElement>("[data-tarjetas]")!;
  const tarjetas = todos<HTMLLIElement>("[data-tarjeta]");
  const botonesGenero = todos<HTMLButtonElement>("[data-genero-boton]");
  const flechas = todos<HTMLButtonElement>("[data-flecha]");
  const escenario = seccion.querySelector<HTMLElement>(".escenario")!;

  let genero = botonesGenero.find((b) => b.ariaPressed === "true")?.dataset.generoBoton ?? "mujer";
  const categoria: Record<string, string> = {};
  const puesta: Record<string, string> = {};
  let visible: HTMLElement[] = [];
  let turno = 0;

  const vista = (clave: string) => seccion.querySelector<HTMLElement>(`[data-vista="${CSS.escape(clave)}"]`);
  const base = (g: string) => seccion.querySelector<HTMLElement>(`[data-base="${g}"]`);

  /** Pide las fotos sin esperar a que se muestren (las `lazy` ocultas no se descargan solas). */
  function precargar(el: HTMLElement | null) {
    el?.querySelectorAll("img").forEach((img) => (img.loading = "eager"));
  }

  function animar(el: HTMLElement, clase: "entra" | "sale") {
    el.classList.remove("entra", "sale");
    void el.offsetWidth;
    el.classList.add(clase);
  }

  /**
   * Muestra exactamente estas capas del escenario: las nuevas entran y las que sobran se desvanecen.
   * `acercar`: hacia dónde va la cámara (`"pies"` con el calzado) o nada para el cuerpo entero.
   */
  async function mostrar(capas: HTMLElement[], acercar?: string) {
    const yo = ++turno;
    capas.forEach(precargar);
    // Esperar a que la foto nueva esté lista evita un fundido hacia el vacío.
    await Promise.all(
      capas.flatMap((c) => [...c.querySelectorAll("img")]).map((img) => (img.complete ? null : img.decode().catch(() => null))),
    );
    if (yo !== turno) return;

    // La cámara se mueve junto con el fundido, cuando la foto nueva ya está lista: así no salta.
    if (acercar) escenario.dataset.acercar = acercar;
    else delete escenario.dataset.acercar;

    for (const el of visible) {
      if (capas.includes(el)) continue;
      animar(el, "sale");
      setTimeout(() => {
        if (el.classList.contains("sale")) {
          el.hidden = true;
          el.classList.remove("sale");
        }
      }, 320);
    }
    for (const el of capas) {
      if (!el.hidden && !el.classList.contains("sale") && visible.includes(el)) continue;
      el.hidden = false;
      animar(el, "entra");
    }
    visible = capas;
    actualizarFlechas();
  }

  function vestir(clave: string | null) {
    if (clave) puesta[genero] = clave;
    else delete puesta[genero];

    todos<HTMLButtonElement>("[data-clave]").forEach((b) => (b.ariaPressed = String(b.dataset.clave === clave)));
    todos<HTMLElement>("[data-barra]").forEach((b) => (b.hidden = b.dataset.barra !== (clave ?? "")));

    const capa = clave ? vista(clave) : null;
    const conModelo = capa?.hasAttribute("data-con-modelo");
    // Calzado con foto puesta: la cámara se acerca a las piernas (ver `data-acercar` en el CSS).
    const acercar = conModelo ? capa?.dataset.acercar : undefined;
    void mostrar([conModelo ? null : base(genero), capa].filter((c): c is HTMLElement => !!c), acercar);
  }

  function elegirCategoria(c: string) {
    categoria[genero] = c;
    seccion.querySelectorAll<HTMLButtonElement>(`[data-pestanas="${genero}"] [data-categoria-boton]`).forEach((b) => {
      b.ariaPressed = String(b.dataset.categoriaBoton === c);
    });
    tarjetas.forEach((t) => {
      t.hidden = !(t.dataset.para === genero && t.dataset.categoria === c);
      if (!t.hidden) precargar(vista(t.querySelector<HTMLElement>("[data-clave]")!.dataset.clave!));
    });
    carril.scrollTo({ left: 0 });
    actualizarFlechas();
  }

  function elegirGenero(g: string) {
    genero = g;
    botonesGenero.forEach((b) => (b.ariaPressed = String(b.dataset.generoBoton === g)));
    todos<HTMLElement>("[data-pestanas]").forEach((p) => (p.hidden = p.dataset.pestanas !== g));
    const primera = seccion.querySelector<HTMLButtonElement>(`[data-pestanas="${g}"] [data-categoria-boton]`);
    elegirCategoria(categoria[g] ?? primera?.dataset.categoriaBoton ?? "");
    // Cada modelo arranca con la primera prenda que tiene foto puesta, y recuerda la última que se le puso.
    vestir(puesta[g] ?? primeraConFoto()?.dataset.clave ?? null);
  }

  const primeraConFoto = () =>
    tarjetas.find((t) => !t.hidden && t.querySelector("[data-con-foto]"))?.querySelector<HTMLElement>("[data-clave]");

  const escritorio = matchMedia("(min-width: 60rem)");

  function actualizarFlechas() {
    const fin = carril.scrollWidth - carril.clientWidth - 2;
    flechas.forEach((f) => (f.disabled = f.dataset.flecha === "-1" ? carril.scrollLeft <= 2 : carril.scrollLeft >= fin));
    // En escritorio las tarjetas pasan detrás del modelo: las que quedan tapadas se atenúan.
    const cuerpo = seccion.querySelector(".camara > :not([hidden]) img")?.getBoundingClientRect();
    tarjetas.forEach((t) => {
      if (t.hidden) return;
      const r = t.getBoundingClientRect();
      const centro = r.left + r.width / 2;
      const tapada = escritorio.matches && !!cuerpo && centro > cuerpo.left + cuerpo.width * 0.15 && centro < cuerpo.right - cuerpo.width * 0.15;
      t.classList.toggle("detras", tapada);
    });
  }

  /* ---------- Eventos ---------- */
  seccion.addEventListener("click", (e) => {
    const objetivo = e.target as HTMLElement;
    const tarjeta = objetivo.closest<HTMLButtonElement>("[data-clave]");
    if (tarjeta) return vestir(tarjeta.ariaPressed === "true" ? null : tarjeta.dataset.clave!);
    const pestana = objetivo.closest<HTMLButtonElement>("[data-categoria-boton]");
    if (pestana) return elegirCategoria(pestana.dataset.categoriaBoton!);
    const botonGenero = objetivo.closest<HTMLButtonElement>("[data-genero-boton]");
    if (botonGenero && botonGenero.dataset.generoBoton !== genero) return elegirGenero(botonGenero.dataset.generoBoton!);
    const flecha = objetivo.closest<HTMLButtonElement>("[data-flecha]");
    if (flecha) carril.scrollBy({ left: Number(flecha.dataset.flecha) * carril.clientWidth * 0.7, behavior: "smooth" });
  });

  // Pasar el mouse o enfocar una tarjeta pide su foto antes del clic.
  const anticipar = (e: Event) => {
    const clave = (e.target as HTMLElement).closest<HTMLElement>("[data-clave]")?.dataset.clave;
    if (clave) precargar(vista(clave));
  };
  carril.addEventListener("pointerover", anticipar);
  carril.addEventListener("focusin", anticipar);
  carril.addEventListener("scroll", actualizarFlechas, { passive: true });
  addEventListener("resize", actualizarFlechas, { passive: true });
  // Al terminar un acercamiento el modelo ocupa otro espacio: recalcular qué tarjetas tapa.
  escenario.addEventListener("transitionend", (e) => {
    if (e.propertyName === "transform" && (e.target as HTMLElement).classList.contains("camara")) actualizarFlechas();
  });

  visible = [base(genero)].filter((c): c is HTMLElement => !!c);
  elegirGenero(genero);
}

export {};
