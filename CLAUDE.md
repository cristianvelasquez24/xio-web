# XIO · Active Wear — Web catálogo

## Qué es este proyecto
Web vitrina (solo catálogo, **sin venta ni pedidos**) de la marca de ropa **XIO · Active Wear**.
Ropa deportiva (línea principal) y algunas prendas formales (línea secundaria), para mujer y hombre.
Entre 20 y 60 prendas. "Xio" es el apodo del dueño de la marca.

## Público
Jóvenes de 18 a 30 años. Llegan casi siempre desde el celular → **mobile-first** siempre.

## Identidad
- Nombre: **XIO** con descriptor pequeño **Active Wear**. Logotipo tipográfico (sin imagen), fácil de reemplazar.
- Líneas:
  - **Sport** → deportiva. Es la protagonista.
  - **Casual** → ropa casual, no deportiva. Se presenta como extensión de la marca, no como otra tienda.
  - **Beauty** → perfumes y cremas (especialmente Victoria's Secret).
- "Active Wear" es el descriptor del logo, no una línea: no se renombra.
- Estilo: atractivo, minimalista, moderno, tipo lookbook. Fotos grandes, poco texto, títulos grandes.
- Opcional (pendiente de decidir): una línea breve en la portada que haga guiño al apodo "Xio".

## Paleta y tokens
Pastel apagado sobre base oscura. **Todos** los valores de marca viven en `src/styles/tokens.css`
como variables CSS. Ningún componente debe tener colores o fuentes escritos a mano.

```css
:root {
  --color-fondo: #323a35;       /* carbón verdoso (aclarado) */
  --color-superficie: #3c4540;  /* tarjetas */
  --color-texto: #ece8e1;
  --color-texto-suave: #bcbeb6;
  --color-salvia: #a8b5a2;      /* acento principal */
  --color-lavanda: #b3aac4;     /* acento secundario */
  --color-arena: #d8c8b0;       /* acento terciario */
  --fuente-titulos: "Space Grotesk", system-ui, sans-serif;
  --fuente-base: "Inter", system-ui, sans-serif;
  --radio: 12px;
  --espacio-1: 0.5rem;
  --espacio-2: 1rem;
  --espacio-3: 2rem;
  --espacio-4: 4rem;
}
```
Los valores son un punto de partida; se ajustarán viendo el diseño en pantalla.
En `tokens.css` solo van **decisiones de marca** (colores, tipografía, radios, espaciados).
La distribución (grids, columnas, posiciones) se queda en los componentes.
Mantener contraste de texto mínimo WCAG AA.

## Stack
- **Astro** (sitio estático, HTML generado en build).
- Datos en `src/data/productos.json`.
- Imágenes con `astro:assets` (`<Picture>`), salida WebP/AVIF en varios anchos (~400/800/1200 px).
- JavaScript mínimo, sin framework de UI.
- Despliegue: Netlify o Vercel conectado al repo (por decidir). `git push` = publicar.

## Estructura de la página
Una sola página:
1. **Portada**: imagen destacada grande + marca.
2. **Tres accesos**: Sport (más peso visual), Casual y Beauty.
3. **Catálogo**: grid de tarjetas con filtros.

### Catálogo
- Tarjetas con foto vertical **4:5** (`object-fit: cover`), nombre, línea y precio.
- Grid: 2 columnas en móvil, 3–4 en escritorio.
- **Filtros** como chips horizontales:
  - Género: Todos / Mujer / Hombre (las prendas `unisex` aparecen en ambos).
  - Línea: Todo / Sport / Casual / Beauty. El grid se ordena en ese mismo orden.
- Todas las prendas se renderizan en el HTML; los filtros solo muestran/ocultan con JS ligero.
- El estado de los filtros se refleja en la URL (`?linea=casual&genero=mujer`) para que los accesos
  de la portada lleven al catálogo ya filtrado.

## Esquema de `productos.json`
```json
[
  {
    "id": "leggins-core-salvia",
    "nombre": "Leggins Core",
    "genero": "mujer",
    "linea": "sport",
    "precio": 89000,
    "tallas": ["S", "M", "L"],
    "imagen": "leggins-core-salvia.jpg",
    "agotado": false
  }
]
```
- `genero`: `"mujer" | "hombre" | "unisex"`
- `linea`: `"sport" | "casual" | "beauty"`
- `precio`: número o `null` (si es null no se muestra).
- `tallas`: lista de textos (`["S", "M"]`, `["32"]`) o `[]` si no aplica (bolsos). Se muestra en la tarjeta.
  En Beauty se usa para la presentación (`["236 ml"]`) y se muestra como "Presentación".
- `imagen`: nombre del archivo en `src/assets/productos/`. Coincide con el `id`.
- Fotos adicionales: archivos `<id>-2.jpg`, `<id>-3.jpg`… se detectan solos y se muestran como galería
  deslizable en la tarjeta. No se listan en el JSON.
- Validar el JSON al compilar (content collection o esquema zod). Un error de datos debe romper el build,
  no la página.

## Reglas de "agotado"
- Las prendas agotadas **no se ocultan**: llevan la etiqueta "Agotado", imagen atenuada
  y se ordenan **al final** del grid.

## Configuración general
`src/config.ts`:
- `mostrarPrecio: true` → permite quitar los precios de toda la web con un solo cambio.
- Formato de precio: pesos colombianos (`es-CO`, COP) — provisional, confirmar con el dueño.

## Imágenes
- Fotos caseras de celular, tomadas con mismo fondo, luz natural y formato vertical.
- Nombres de archivo: minúsculas, sin espacios ni tildes, iguales al `id` del producto.
- **No subir originales pesados al repo**: solo versiones de máx. ~2000 px. Astro genera el resto.
- `alt` de cada imagen = nombre de la prenda + línea.
- Mientras no haya fotos reales: usar imágenes provisionales neutras en 4:5.

## Decisiones descartadas (no volver a proponer)
- ❌ Carrito, pagos o checkout.
- ❌ Botón de WhatsApp, Instagram o cualquier acción por prenda.
- ❌ Pie de página con redes o contacto.
- ❌ Estilos en JSON (se usan variables CSS en `tokens.css`).
- ❌ Cargar el catálogo con fetch en el navegador (se genera en build, por SEO).
- ❌ Más filtros que género y línea (el volumen no lo justifica).

## Primera tarea sugerida
Crear el proyecto base con: `tokens.css`, `config.ts`, portada, accesos Sport/Casual, catálogo con
filtros y etiqueta de agotado, y **8 productos de ejemplo** (mezcla de géneros y líneas, 2 agotados)
con imágenes provisionales.
