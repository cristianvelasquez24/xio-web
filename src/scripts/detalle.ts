/**
 * Modal de detalle. Se abre al tocar la foto o el nombre de una tarjeta.
 * Reutiliza las fotos de la tarjeta (mismo srcset) con un `sizes` mayor, así el
 * navegador descarga la versión grande solo cuando se abre el detalle.
 *
 * Historial: al abrir se agrega `#producto-<id>` a la URL. Así el botón "atrás"
 * del celular cierra el modal en vez de salir de la web, y el enlace se puede compartir.
 */
interface Detalle {
  nombre: string;
  linea: string;
  genero: string;
  precio: string | null;
  etiquetaTallas: string | null;
  tallas: string[];
  agotado: boolean;
}

const PREFIJO = "#producto-";
const SIZES_GRANDE = "(min-width: 48rem) 36rem, 100vw";
const SIZES_MINIATURA = "4rem";

const dialogoEnPagina = document.querySelector<HTMLDialogElement>("[data-detalle-dialogo]");
if (dialogoEnPagina) iniciar(dialogoEnPagina);

function iniciar(dialogo: HTMLDialogElement) {
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => dialogo.querySelector<T>(selector)!;
  const medios = $(".medios");
  const fotos = $("[data-fotos]");
  const miniaturas = $("[data-miniaturas]");
  const anterior = $<HTMLButtonElement>("[data-anterior]");
  const siguiente = $<HTMLButtonElement>("[data-siguiente]");
  const suave = () => !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const indiceDe = (el: HTMLElement) => Math.round(el.scrollLeft / (el.clientWidth || 1));

  let total = 0;

  /** Copia un <picture> de la tarjeta, limpio de clases, con otro `sizes`. */
  function copiarFoto(original: HTMLPictureElement, sizes: string, alt?: string) {
    const copia = original.cloneNode(true) as HTMLPictureElement;
    copia.removeAttribute("class");
    for (const el of copia.querySelectorAll("source, img")) el.setAttribute("sizes", sizes);
    const img = copia.querySelector("img")!;
    img.removeAttribute("class");
    img.loading = "eager";
    if (alt !== undefined) img.alt = alt;
    return copia;
  }

  function llenar(tarjeta: HTMLElement) {
    const d = JSON.parse(tarjeta.dataset.detalle ?? "{}") as Detalle;
    const originales = [...tarjeta.querySelectorAll<HTMLPictureElement>("[data-galeria] picture")];
    total = originales.length;

    fotos.replaceChildren(
      ...originales.map((p) => {
        const slide = document.createElement("div");
        slide.className = "slide";
        slide.append(copiarFoto(p, SIZES_GRANDE));
        return slide;
      }),
    );

    miniaturas.replaceChildren(
      ...(total > 1
        ? originales.map((p, i) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "miniatura";
            boton.dataset.indice = String(i);
            boton.setAttribute("aria-label", `Ver foto ${i + 1} de ${total}`);
            boton.append(copiarFoto(p, SIZES_MINIATURA, ""));
            return boton;
          })
        : []),
    );
    miniaturas.hidden = total < 2;
    medios.classList.toggle("varias", total > 1);

    $("[data-linea]").textContent = d.linea;
    $("[data-genero]").textContent = d.genero;
    $("[data-nombre]").textContent = d.nombre;

    const precio = $("[data-precio]");
    precio.textContent = d.precio ?? "";
    precio.hidden = !d.precio;

    $("[data-agotado]").hidden = !d.agotado;
    $("[data-estado]").hidden = !d.agotado;

    $("[data-bloque-tallas]").hidden = !d.etiquetaTallas;
    $("[data-etiqueta-tallas]").textContent = d.etiquetaTallas ?? "";
    $("[data-tallas]").replaceChildren(
      ...d.tallas.map((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        return li;
      }),
    );
  }

  function marcar() {
    const actual = indiceDe(fotos);
    for (const m of miniaturas.querySelectorAll<HTMLElement>(".miniatura")) {
      if (Number(m.dataset.indice) === actual) m.setAttribute("aria-current", "true");
      else m.removeAttribute("aria-current");
    }
    anterior.disabled = actual <= 0;
    siguiente.disabled = actual >= total - 1;
  }

  function irA(indice: number, animar = true) {
    const destino = Math.max(0, Math.min(total - 1, indice));
    fotos.scrollTo({ left: destino * fotos.clientWidth, behavior: animar && suave() ? "smooth" : "auto" });
  }

  /** Pantalla completa (solo la foto). Mantiene la foto que se estaba viendo. */
  function ampliar(activar: boolean) {
    const actual = indiceDe(fotos);
    dialogo.classList.toggle("ampliada", activar);
    for (const el of fotos.querySelectorAll("source, img")) el.setAttribute("sizes", activar ? "100vw" : SIZES_GRANDE);
    $("[data-cerrar]").setAttribute("aria-label", activar ? "Salir de pantalla completa" : "Cerrar");
    requestAnimationFrame(() => {
      irA(actual, false);
      marcar();
    });
  }

  function abrir(tarjeta: HTMLElement, indice = 0, conHistorial = true) {
    dialogo.classList.remove("ampliada");
    $("[data-cerrar]").setAttribute("aria-label", "Cerrar");
    llenar(tarjeta);
    dialogo.showModal();
    irA(indice, false);
    marcar();
    $(".caja").scrollTop = 0;
    if (conHistorial) {
      history.pushState({ detalle: tarjeta.dataset.id }, "", `${location.pathname}${location.search}${PREFIJO}${tarjeta.dataset.id}`);
    }
  }

  const tarjetaPorId = (id: string | undefined) =>
    id ? document.querySelector<HTMLElement>(`[data-producto][data-id="${CSS.escape(id)}"]`) : null;

  // Abrir: tocar la foto o el nombre de una tarjeta.
  document.addEventListener("click", (evento) => {
    const disparador = (evento.target as HTMLElement).closest("[data-abrir-detalle], [data-galeria]");
    const tarjeta = disparador?.closest<HTMLElement>("[data-producto]");
    if (!tarjeta) return;
    abrir(tarjeta, indiceDe(tarjeta.querySelector<HTMLElement>("[data-galeria]")!));
  });

  // Con teclado, la galería de la tarjeta (enfocable si tiene varias fotos) abre con Enter.
  document.addEventListener("keydown", (evento) => {
    const galeria = (evento.target as HTMLElement).closest<HTMLElement>("[data-galeria]");
    const tarjeta = galeria?.closest<HTMLElement>("[data-producto]");
    if (evento.key === "Enter" && galeria && tarjeta) abrir(tarjeta, indiceDe(galeria));
  });

  // Navegación dentro del modal.
  fotos.addEventListener("scroll", marcar, { passive: true });
  anterior.addEventListener("click", () => irA(indiceDe(fotos) - 1));
  siguiente.addEventListener("click", () => irA(indiceDe(fotos) + 1));
  miniaturas.addEventListener("click", (evento) => {
    const m = (evento.target as HTMLElement).closest<HTMLElement>(".miniatura");
    if (m) irA(Number(m.dataset.indice));
  });
  dialogo.addEventListener("keydown", (evento) => {
    if (evento.key === "ArrowLeft") irA(indiceDe(fotos) - 1);
    if (evento.key === "ArrowRight") irA(indiceDe(fotos) + 1);
  });

  // Tocar la foto dentro del modal alterna la pantalla completa. Entrar agrega un paso
  // al historial, así "atrás" primero sale de pantalla completa y luego cierra.
  const estaAmpliada = () => dialogo.classList.contains("ampliada");
  const salirDeAmpliada = () => (history.state?.ampliada ? history.back() : ampliar(false));
  fotos.addEventListener("click", () => {
    if (estaAmpliada()) {
      salirDeAmpliada();
    } else {
      ampliar(true);
      history.pushState({ ...history.state, ampliada: true }, "", location.href);
    }
  });

  // Cerrar: botón, Esc (nativo del <dialog>), clic fuera de la ventana o "atrás".
  // En pantalla completa, el botón y Esc solo salen de ella.
  $("[data-cerrar]").addEventListener("click", () => (estaAmpliada() ? salirDeAmpliada() : dialogo.close()));
  dialogo.addEventListener("cancel", (evento) => {
    if (estaAmpliada()) {
      evento.preventDefault();
      salirDeAmpliada();
    }
  });
  dialogo.addEventListener("click", (evento) => {
    if (evento.target === dialogo) dialogo.close();
  });
  dialogo.addEventListener("close", () => {
    fotos.replaceChildren();
    miniaturas.replaceChildren();
    dialogo.classList.remove("ampliada");
    const pasos = history.state?.ampliada ? 2 : history.state?.detalle ? 1 : 0;
    if (pasos > 0) history.go(-pasos);
  });

  // El historial manda: la interfaz se ajusta al estado al ir atrás o adelante.
  window.addEventListener("popstate", () => {
    const estado = history.state as { detalle?: string; ampliada?: boolean } | null;
    if (!estado?.detalle) {
      if (dialogo.open) dialogo.close();
      return;
    }
    if (!dialogo.open) {
      const tarjeta = tarjetaPorId(estado.detalle);
      if (!tarjeta) return;
      abrir(tarjeta, 0, false);
    }
    if (Boolean(estado.ampliada) !== estaAmpliada()) ampliar(Boolean(estado.ampliada));
  });

  // Enlace directo: /#producto-<id> abre el detalle al cargar.
  if (location.hash.startsWith(PREFIJO)) {
    const tarjeta = tarjetaPorId(location.hash.slice(PREFIJO.length));
    if (tarjeta) {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      abrir(tarjeta);
    }
  }
}
