/**
 * Carga y valida `productos.json` en build. Cualquier error de datos
 * (campo inválido, id repetido, imagen que falta) rompe el build.
 */
import type { ImageMetadata } from "astro";
import { z } from "astro/zod";
import datos from "../data/productos.json";

export const GENEROS = ["mujer", "hombre", "unisex"] as const;
/** El orden de este arreglo es el orden de las líneas en el grid. */
export const LINEAS = ["sport", "casual", "beauty"] as const;

export type Genero = (typeof GENEROS)[number];
export type Linea = (typeof LINEAS)[number];

export const NOMBRE_LINEA: Record<Linea, string> = {
  sport: "Sport",
  casual: "Casual",
  beauty: "Beauty",
};

const esquemaProducto = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "solo minúsculas, números y guiones, sin tildes ni espacios"),
    nombre: z.string().trim().min(1),
    genero: z.enum(GENEROS),
    linea: z.enum(LINEAS),
    precio: z.number().int().positive().nullable(),
    tallas: z.array(z.string().trim().min(1)).default([]),
    imagen: z.string().regex(/^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/, "archivo .jpg, .jpeg, .png o .webp en minúsculas"),
    agotado: z.boolean().default(false),
  })
  .refine((p) => p.imagen.replace(/\.[a-z]+$/, "") === p.id, {
    message: "el nombre de la imagen debe coincidir con el id",
    path: ["imagen"],
  });

const esquemaCatalogo = z.array(esquemaProducto).superRefine((productos, ctx) => {
  const vistos = new Set<string>();
  productos.forEach((p, i) => {
    if (vistos.has(p.id)) {
      ctx.addIssue({ code: "custom", message: `id repetido: "${p.id}"`, path: [i, "id"] });
    }
    vistos.add(p.id);
  });
});

const archivos = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/productos/*.{jpg,jpeg,png,webp}",
  { eager: true },
);

const imagenes = new Map(
  Object.entries(archivos).map(([ruta, modulo]) => [ruta.split("/").pop()!, modulo.default]),
);

function cargar() {
  const resultado = esquemaCatalogo.safeParse(datos);
  if (!resultado.success) {
    throw new Error(`productos.json no es válido:\n${z.prettifyError(resultado.error)}`);
  }

  const faltantes = resultado.data.filter((p) => !imagenes.has(p.imagen)).map((p) => p.imagen);
  if (faltantes.length > 0) {
    throw new Error(`Faltan imágenes en src/assets/productos/: ${faltantes.join(", ")}`);
  }

  const usadas = new Set<string>();
  const conFotos = resultado.data.map((p) => {
    // Fotos adicionales por convención de nombre: <id>-2.jpg, <id>-3.jpg...
    const extras = [...imagenes.keys()]
      .map((archivo) => ({ archivo, n: archivo.match(new RegExp(`^${p.id}-(\\d+)\\.[a-z]+$`))?.[1] }))
      .filter((e) => e.n !== undefined)
      .sort((a, b) => Number(a.n) - Number(b.n))
      .map((e) => e.archivo);
    const archivos = [p.imagen, ...extras];
    archivos.forEach((a) => usadas.add(a));
    return { ...p, fotos: archivos.map((a) => imagenes.get(a)!) };
  });

  const sobrantes = [...imagenes.keys()].filter((a) => !usadas.has(a));
  if (sobrantes.length > 0) {
    console.warn(`[productos] Imágenes sin producto en src/assets/productos/: ${sobrantes.join(", ")}`);
  }

  return conFotos;
}

export type Producto = ReturnType<typeof cargar>[number];

/**
 * Orden del grid: disponibles antes que agotadas y, dentro de cada grupo,
 * las líneas en el orden de LINEAS (Sport, Casual, Beauty). El resto respeta el orden
 * del JSON (sort estable).
 */
function peso(p: Producto): number {
  return (p.agotado ? LINEAS.length : 0) + LINEAS.indexOf(p.linea);
}

export const productos: Producto[] = cargar().sort((a, b) => peso(a) - peso(b));

export function altProducto(p: Producto): string {
  return `${p.nombre}, línea ${NOMBRE_LINEA[p.linea]}`;
}
