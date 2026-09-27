import { config } from "../config";

const formato = new Intl.NumberFormat(config.precio.locale, {
  style: "currency",
  currency: config.precio.moneda,
  maximumFractionDigits: 0,
});

export function formatearPrecio(valor: number): string {
  return formato.format(valor);
}
