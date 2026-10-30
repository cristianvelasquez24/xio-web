/**
 * Recorta (quita el fondo) las fotos que usa la V2 y las guarda en
 * src/assets/productos_v2/<id>.webp, con fondo transparente y sin márgenes vacíos.
 *
 * Qué fotos se recortan: las de los ids listados en src/data/v2.json.
 * Las que ya existen no se vuelven a recortar (borrar el archivo para rehacerlo).
 *
 * La librería de recorte es pesada (modelo de IA local), por eso no está en package.json:
 *   npm i --no-save @imgly/background-removal-node
 *   node scripts/recortar-v2.mjs
 * También se puede indicar dónde está instalada: RECORTE_LIB=/ruta/a/node_modules/@imgly/background-removal-node
 */
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const RAIZ = new URL("..", import.meta.url).pathname.replace(/^\/([a-z]:)/i, "$1");
const ORIGEN = join(RAIZ, "src/assets/productos");
const DESTINO = join(RAIZ, "src/assets/productos_v2");
const ALTO_MAX = 1400;

const carpetaLib = process.env.RECORTE_LIB ?? join(RAIZ, "node_modules/@imgly/background-removal-node");
const lib = await import(pathToFileURL(join(carpetaLib, "dist/index.cjs")).href);
const { removeBackground } = lib.default ?? lib;
// Se usa el mismo sharp que trae la librería: dos versiones de sharp en un proceso se caen.
const sharp = createRequire(join(carpetaLib, "package.json"))("sharp");
// El modelo se carga desde la carpeta de la librería, no desde la del proyecto.
const publicPath = pathToFileURL(join(carpetaLib, "dist")).href + "/";

const v2 = JSON.parse(readFileSync(join(RAIZ, "src/data/v2.json"), "utf8"));
const ids = [...new Set([...v2.colgador, ...v2.looks, ...v2.orbita])];
const archivos = readdirSync(ORIGEN);

mkdirSync(DESTINO, { recursive: true });

for (const id of ids) {
  const salida = join(DESTINO, `${id}.webp`);
  if (existsSync(salida)) continue;

  const original = archivos.find((a) => a.replace(/\.[a-z]+$/, "") === id);
  if (!original) {
    console.warn(`  sin foto: ${id}`);
    continue;
  }

  // Se pasa a PNG antes: la librería no lee AVIF ni todos los WebP.
  const png = await sharp(join(ORIGEN, original)).rotate().resize({ height: 1600, withoutEnlargement: true }).png().toBuffer();
  const recorte = await removeBackground(new Blob([png], { type: "image/png" }), {
    publicPath,
    model: "medium",
    output: { format: "image/png" },
  });

  await sharp(Buffer.from(await recorte.arrayBuffer()))
    .trim({ threshold: 8 })
    .resize({ height: ALTO_MAX, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(salida);
  console.log(`  ✓ ${id}`);
}
