/**
 * Prepara las fotos del closet (el modelo con cada prenda puesta, generadas con IA):
 * quita el fondo, corta los márgenes vacíos y deja todas de la cabeza a los pies con la misma
 * altura, en src/assets/closet/<nombre>.webp. Así el modelo no "salta" al cambiar de prenda.
 *
 * Origen: la carpeta `fotos-closet/` en la raíz (no se sube al repo, son originales pesados),
 * o la que se pase como argumento. Cada archivo se llama como el id de la prenda
 * (`polo-vestido-tommy.png`), `base-mujer` / `base-hombre` para el modelo base, o `fondo` para
 * la foto del vestidor vacío (esa no se recorta).
 * Formatos: .jpg .jpeg .jfif .png .webp. Las que ya existen en el destino no se rehacen
 * (borrar el .webp para rehacerla).
 *
 * Usa la misma librería de recorte que scripts/recortar-v2.mjs (no va en package.json):
 *   npm i --no-save @imgly/background-removal-node
 *   node scripts/recortar-closet.mjs [carpeta]
 * También: RECORTE_LIB=/ruta/a/node_modules/@imgly/background-removal-node
 */
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const RAIZ = new URL("..", import.meta.url).pathname.replace(/^\/([a-z]:)/i, "$1");
const ORIGEN = resolve(RAIZ, process.argv[2] ?? "fotos-closet");
const DESTINO = join(RAIZ, "src/assets/closet");
const ALTO = 1400;

const carpetaLib = process.env.RECORTE_LIB ?? join(RAIZ, "node_modules/@imgly/background-removal-node");
const lib = await import(pathToFileURL(join(carpetaLib, "dist/index.cjs")).href);
const { removeBackground } = lib.default ?? lib;
// Se usa el mismo sharp que trae la librería: dos versiones de sharp en un proceso se caen.
const sharp = createRequire(join(carpetaLib, "package.json"))("sharp");
const publicPath = pathToFileURL(join(carpetaLib, "dist")).href + "/";

if (!existsSync(ORIGEN)) {
  console.error(`No existe la carpeta ${ORIGEN}`);
  process.exit(1);
}
mkdirSync(DESTINO, { recursive: true });

for (const archivo of readdirSync(ORIGEN)) {
  const [, nombre] = archivo.match(/^([a-z0-9-]+)\.(jpe?g|jfif|png|webp)$/i) ?? [];
  if (!nombre) {
    if (!archivo.startsWith(".")) console.warn(`  se ignora "${archivo}": el nombre debe ser el id (minúsculas y guiones)`);
    continue;
  }
  const salida = join(DESTINO, `${nombre.toLowerCase()}.webp`);
  if (existsSync(salida)) continue;

  // La foto del vestidor vacío (fondo.*) no se recorta: solo se achica.
  if (nombre.toLowerCase().startsWith("fondo")) {
    await sharp(join(ORIGEN, archivo)).rotate().resize({ width: 2600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(salida);
    console.log(`  ✓ ${nombre} (fondo)`);
    continue;
  }

  const original = await sharp(join(ORIGEN, archivo))
    .rotate()
    .resize({ height: 1800, withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = original.info;

  // Los tenis blancos se confunden con el fondo gris claro de estudio. Para calcular la máscara
  // se usa una copia con el contraste estirado alrededor del color del fondo (medido en las
  // esquinas): el fondo queda gris medio y lo que se aparte de él, aunque sea poco, resalta.
  const fondo = colorFondo(original.data, width, height);
  const analisis = await sharp(original.data, { raw: { width, height, channels: 3 } })
    .linear(2.5, 140 - 2.5 * fondo)
    .png()
    .toBuffer();
  const mascara = await removeBackground(new Blob([analisis], { type: "image/png" }), {
    publicPath,
    model: "medium",
    output: { format: "image/png" },
  });
  const alfa = await sharp(Buffer.from(await mascara.arrayBuffer()))
    .resize(width, height)
    .extractChannel(3)
    .raw()
    .toBuffer();

  // La máscara se aplica a la foto original (sin el contraste estirado).
  const conAlfa = await sharp(original.data, { raw: { width, height, channels: 3 } })
    .joinChannel(alfa, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();

  // Recortar al cuerpo y llevar todas a la misma altura (cabeza arriba, pies abajo).
  await sharp(conAlfa).trim({ threshold: 8 }).resize({ height: ALTO }).webp({ quality: 88, alphaQuality: 90 }).toFile(salida);
  console.log(`  ✓ ${nombre}`);
}

/** Brillo promedio del fondo, medido en las cuatro esquinas de la foto. */
function colorFondo(datos, ancho, alto) {
  let suma = 0;
  let n = 0;
  const lado = Math.round(Math.min(ancho, alto) * 0.04);
  for (const [x0, y0] of [[0, 0], [ancho - lado, 0], [0, alto - lado], [ancho - lado, alto - lado]]) {
    for (let y = y0; y < y0 + lado; y++) {
      for (let x = x0; x < x0 + lado; x++) {
        const i = (y * ancho + x) * 3;
        suma += (datos[i] + datos[i + 1] + datos[i + 2]) / 3;
        n++;
      }
    }
  }
  return suma / n;
}
