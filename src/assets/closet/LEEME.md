# Fotos del closet (V2)

Fotos del modelo inventado con cada prenda puesta, sin fondo, de cuerpo entero.

- `base-mujer.webp` / `base-hombre.webp`: el modelo base con la ropa neutra.
- `<id>.webp`: el modelo con esa prenda (el `id` de `productos.json`).

Mientras una prenda no tenga su foto aquí, el closet usa una provisional (ver `src/lib/closet.ts`).
Qué prendas salen y en qué categoría: `src/data/v2.json` → `closet`.
