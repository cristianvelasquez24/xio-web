/**
 * Genera imágenes provisionales neutras en 4:5 (1600×2000) para cada producto
 * de productos.json y una para la portada. No sobrescribe archivos existentes,
 * así que las fotos reales nunca se pisan.
 *
 * Uso: npm run provisionales
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const destinoProductos = join(raiz, "src/assets/productos");
const productos = JSON.parse(readFileSync(join(raiz, "src/data/productos.json"), "utf8"));

const ANCHO = 1600;
const ALTO = 2000;

// Tonos apagados cercanos a la paleta, para que el grid se vea coherente.
const tonos = {
  salvia: ["#8f9c89", "#5f6b5a"],
  lavanda: ["#9d94ae", "#625a73"],
  arena: ["#c4b49b", "#857761"],
  carbon: ["#4a524c", "#2a302c"],
};

function tonoPara(id) {
  const clave = Object.keys(tonos).find((t) => id.endsWith(t));
  return tonos[clave ?? "carbon"];
}

function escapar(texto) {
  return texto.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function svg({ titulo, subtitulo, colores }) {
  const [claro, oscuro] = colores;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="1" stop-color="${oscuro}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="520" y="560" width="560" height="760" rx="48" fill="#ffffff" fill-opacity="0.08"/>
  <text x="50%" y="1560" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="96" font-weight="600" fill="#ffffff" fill-opacity="0.85">${escapar(titulo)}</text>
  <text x="50%" y="1660" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="48" letter-spacing="8" fill="#ffffff" fill-opacity="0.6">${escapar(subtitulo)}</text>
</svg>`;
}

async function crear(ruta, opciones) {
  if (existsSync(ruta)) {
    console.log(`= ya existe, se conserva: ${ruta}`);
    return;
  }
  await sharp(Buffer.from(svg(opciones))).jpeg({ quality: 82, mozjpeg: true }).toFile(ruta);
  console.log(`+ creada: ${ruta}`);
}

mkdirSync(destinoProductos, { recursive: true });

for (const p of productos) {
  await crear(join(destinoProductos, p.imagen), {
    titulo: p.nombre,
    subtitulo: `FOTO PROVISIONAL · ${p.linea.toUpperCase()}`,
    colores: tonoPara(p.id),
  });
}

await crear(join(raiz, "src/assets/portada.jpg"), {
  titulo: "XIO",
  subtitulo: "FOTO DE PORTADA PROVISIONAL",
  colores: tonos.salvia,
});
