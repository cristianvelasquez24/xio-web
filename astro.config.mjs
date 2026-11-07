// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // Cambiar por el dominio real al decidir Netlify o Vercel.
  site: "https://xio.example.com",
  output: "static",
  // La V2 pasó a ser la página principal; los enlaces viejos a /v2 llevan al inicio.
  redirects: { "/v2": "/" },
});
