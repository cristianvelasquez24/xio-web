/**
 * Filtros del catálogo. Todas las prendas ya están en el HTML; aquí solo se
 * muestran u ocultan y se sincroniza el estado con la URL (?linea=casual&genero=mujer).
 */
import { coincide, escribirEstado, estadoPorDefecto, leerEstado, type ClaveFiltro, type Estado } from "./filtros-estado";

const catalogo = document.getElementById("catalogo");

if (catalogo) {
  const tarjetas = [...catalogo.querySelectorAll<HTMLElement>("[data-producto]")];
  const chips = [...catalogo.querySelectorAll<HTMLButtonElement>("[data-filtro]")];
  const vacio = catalogo.querySelector<HTMLElement>("[data-vacio]");
  const contador = catalogo.querySelector<HTMLElement>("[data-contador]");

  let estado = leerEstado(location.search);

  function aplicar() {
    let visibles = 0;
    for (const tarjeta of tarjetas) {
      const visible = coincide(estado, tarjeta.dataset.genero ?? "", tarjeta.dataset.linea ?? "");
      tarjeta.hidden = !visible;
      if (visible) visibles++;
    }

    for (const chip of chips) {
      const activo = estado[chip.dataset.filtro as ClaveFiltro] === chip.dataset.valor;
      chip.setAttribute("aria-pressed", String(activo));
    }

    if (vacio) vacio.hidden = visibles > 0;
    if (contador) contador.textContent = visibles === 1 ? "1 prenda" : `${visibles} prendas`;
  }

  function actualizarURL(hash = location.hash) {
    history.replaceState(null, "", `${location.pathname}${escribirEstado(estado)}${hash}`);
  }

  function cambiar(nuevo: Estado, hash?: string) {
    estado = nuevo;
    aplicar();
    actualizarURL(hash);
  }

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      cambiar({ ...estado, [chip.dataset.filtro as ClaveFiltro]: chip.dataset.valor! });
    });
  }

  catalogo.querySelector("[data-limpiar]")?.addEventListener("click", () => {
    cambiar(estadoPorDefecto());
  });

  // Accesos de la portada: cambian solo la línea (el género elegido se mantiene) y bajan al catálogo.
  for (const acceso of document.querySelectorAll<HTMLAnchorElement>("[data-acceso-linea]")) {
    acceso.addEventListener("click", (evento) => {
      if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
      evento.preventDefault();
      cambiar({ ...estado, linea: acceso.dataset.accesoLinea! }, "#catalogo");
      const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      catalogo.scrollIntoView({ behavior: suave ? "smooth" : "auto" });
    });
  }

  aplicar();
  // Normaliza la URL si traía valores inválidos o redundantes.
  if (location.search !== escribirEstado(estado)) actualizarURL();
}
