/**
 * V2 · Closet: qué prendas se pueden "probar" en el modelo y con qué foto.
 *
 * - Las prendas se eligen en `src/data/v2.json` → `closet` → mujer|hombre → categoría → ids.
 * - En el escenario SOLO sale el modelo inventado: fotos de `src/assets/closet/`, nunca las de otras modelos.
 *   - `<id>.webp`: el modelo con esa prenda puesta.
 *   - `<id>-cerca.webp` (opcional, para calzado): primer plano de las piernas con esa prenda, para que
 *     el acercamiento se vea nítido. Sin él, el acercamiento agranda la foto de cuerpo entero.
 *   - Sin esa foto, se ve el modelo base y la prenda a su lado.
 * - Modelo base: `src/assets/closet/base-mujer.webp` / `base-hombre.webp`. Un género sin modelo base
 *   no sale en el closet (se oculta su botón) hasta que exista la foto.
 * - Fondo: si existe `src/assets/closet/fondo.*` (una foto del vestidor vacío), reemplaza el vestidor dibujado.
 * - Las prendas agotadas no entran. Un id que no existe rompe el build.
 */
import type { ImageMetadata } from "astro";
import { z } from "astro/zod";
import datos from "../data/v2.json";
import { productos, type Producto } from "./productos";

export const GENEROS_CLOSET = ["mujer", "hombre"] as const;
export type GeneroCloset = (typeof GENEROS_CLOSET)[number];

/** El orden de este arreglo es el orden de las pestañas. */
export const CATEGORIAS = ["superior", "inferior", "chaquetas", "completos", "interior", "calzado", "accesorios"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  superior: "Superior",
  inferior: "Inferior",
  chaquetas: "Chaquetas",
  completos: "Completos",
  interior: "Interior",
  calzado: "Calzado",
  accesorios: "Accesorios",
};

/** Alto/ancho a partir del cual una foto recortada es de cuerpo entero (una modelo, no la prenda sola). */
const PROPORCION_CUERPO_ENTERO = 1.8;

const esquema = z.record(z.enum(GENEROS_CLOSET), z.partialRecord(z.enum(CATEGORIAS), z.array(z.string())));

const cargarCarpeta = (archivos: Record<string, { default: ImageMetadata }>) =>
  new Map(Object.entries(archivos).map(([ruta, m]) => [ruta.split("/").pop()!.replace(/\.[a-z]+$/, ""), m.default]));

const generadas = cargarCarpeta(
  import.meta.glob<{ default: ImageMetadata }>("../assets/closet/*.{webp,png,avif,jpg,jpeg}", { eager: true }),
);
const recortes = cargarCarpeta(
  import.meta.glob<{ default: ImageMetadata }>("../assets/productos_v2/*.{webp,png,avif}", { eager: true }),
);

const cuerpoEntero = (img: ImageMetadata | undefined) =>
  img && img.height / img.width >= PROPORCION_CUERPO_ENTERO ? img : undefined;

export type PiezaCloset = Producto & {
  categoria: Categoria;
  /** Foto pequeña de la prenda para la tarjeta. */
  miniatura: ImageMetadata;
  /** Foto del modelo con la prenda puesta, o `null` (se muestra el modelo base + la prenda). */
  modelo: ImageMetadata | null;
  /** Primer plano de las piernas con la prenda (calzado), o `null`. */
  cerca: ImageMetadata | null;
};

export type GrupoCloset = {
  genero: GeneroCloset;
  base: ImageMetadata;
  categorias: { categoria: Categoria; piezas: PiezaCloset[] }[];
};

function cargar(): GrupoCloset[] {
  const resultado = esquema.safeParse(datos.closet);
  if (!resultado.success) throw new Error(`v2.json → closet no es válido:\n${z.prettifyError(resultado.error)}`);

  const errores: string[] = [];
  const grupos = GENEROS_CLOSET.flatMap((genero) => {
    const base = generadas.get(`base-${genero}`);

    const categorias = CATEGORIAS.map((categoria) => {
      const piezas = (resultado.data[genero][categoria] ?? []).flatMap((id): PiezaCloset[] => {
        const producto = productos.find((p) => p.id === id);
        if (!producto) {
          errores.push(`closet: "${id}" no está en productos.json`);
          return [];
        }
        if (producto.agotado) return [];
        const recorte = recortes.get(id);
        return [
          {
            ...producto,
            categoria,
            // En la tarjeta, la prenda sola; si el recorte es de una modelo, la foto del catálogo.
            miniatura: recorte && !cuerpoEntero(recorte) ? recorte : producto.fotos[0],
            modelo: generadas.get(id) ?? null,
            cerca: generadas.get(`${id}-cerca`) ?? null,
          },
        ];
      });
      return { categoria, piezas };
    }).filter((c) => c.piezas.length > 0);

    return base ? [{ genero, base, categorias }] : [];
  });

  if (errores.length > 0) throw new Error(errores.join("\n"));
  return grupos;
}

export const closet = cargar();

/** Foto del vestidor vacío (opcional). Sin ella, el vestidor se dibuja con CSS. */
export const fondo: ImageMetadata | undefined = generadas.get("fondo");

/** Fotos recortadas de productos (la prenda sola) para las repisas del vestidor. Las que no existan se omiten. */
export function decoracion(ids: string[]): ImageMetadata[] {
  return ids.flatMap((id) => {
    const img = recortes.get(id);
    return img && !cuerpoEntero(img) ? [img] : [];
  });
}
