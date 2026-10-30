/**
 * Datos de la V2 (página /v2): qué prendas van en cada sección y su foto recortada.
 * Las secciones se eligen en `src/data/v2.json` por id; las fotos sin fondo viven en
 * `src/assets/productos_v2/<id>.webp` (se generan con `scripts/recortar-v2.mjs`).
 * Un id que no existe o una foto que falta rompen el build.
 */
import type { ImageMetadata } from "astro";
import { z } from "astro/zod";
import { config } from "../config";
import datos from "../data/v2.json";
import { formatearPrecio } from "./precio";
import { productos, type Producto } from "./productos";

const esquema = z.strictObject({
  colgador: z.array(z.string()).min(1),
  looks: z.array(z.string()).min(1),
  orbita: z.array(z.string()).min(1),
});

const recortes = import.meta.glob<{ default: ImageMetadata }>("../assets/productos_v2/*.{webp,png,avif}", {
  eager: true,
});

const fotoRecortada = new Map(
  Object.entries(recortes).map(([ruta, modulo]) => [ruta.split("/").pop()!.replace(/\.[a-z]+$/, ""), modulo.default]),
);

export type PiezaV2 = Producto & { recorte: ImageMetadata };

function cargar() {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) throw new Error(`v2.json no es válido:\n${z.prettifyError(resultado.error)}`);

  const errores: string[] = [];
  const resolver = (ids: string[]): PiezaV2[] =>
    ids.flatMap((id) => {
      const producto = productos.find((p) => p.id === id);
      const recorte = fotoRecortada.get(id);
      if (!producto) errores.push(`"${id}" no está en productos.json`);
      if (!recorte) errores.push(`falta src/assets/productos_v2/${id}.webp (correr scripts/recortar-v2.mjs)`);
      return producto && recorte ? [{ ...producto, recorte }] : [];
    });

  const secciones = {
    colgador: resolver(resultado.data.colgador),
    looks: resolver(resultado.data.looks),
    orbita: resolver(resultado.data.orbita),
  };
  if (errores.length > 0) throw new Error(`v2.json:\n${errores.join("\n")}`);
  return secciones;
}

export const v2 = cargar();

/** Precio para mostrar, o `null` si la prenda no tiene o los precios están apagados. */
export function precioV2(p: Producto): string | null {
  return config.mostrarPrecio && p.precio !== null ? formatearPrecio(p.precio) : null;
}

/** "01 / 09" */
export function contador(i: number, total: number): string {
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${dos(i + 1)} / ${dos(total)}`;
}
