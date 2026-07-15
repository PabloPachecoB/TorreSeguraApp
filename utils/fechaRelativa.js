// utils/fechaRelativa.js

const MS_POR_MINUTO = 60 * 1000;
const MS_POR_HORA = 60 * MS_POR_MINUTO;
const MS_POR_DIA = 24 * MS_POR_HORA;

/**
 * Convierte una fecha ISO en una etiqueta relativa corta en español.
 * Ej.: "ahora", "hace 5 min", "hace 2 h", "ayer", "hace 3 d", "14 mar".
 *
 * @param {string} iso - Fecha en formato ISO 8601.
 * @param {Date} [ahora=new Date()] - Referencia de "ahora" (inyectable para pruebas).
 * @returns {string} Etiqueta lista para mostrar. Cadena vacía si la fecha es inválida.
 */
export function fechaRelativa(iso, ahora = new Date()) {
  if (!iso) return "";

  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";

  const diff = ahora.getTime() - fecha.getTime();

  // Fechas futuras (o desfases mínimos de reloj) se muestran como "ahora".
  if (diff < MS_POR_MINUTO) return "ahora";
  if (diff < MS_POR_HORA) return `hace ${Math.floor(diff / MS_POR_MINUTO)} min`;
  if (diff < MS_POR_DIA) return `hace ${Math.floor(diff / MS_POR_HORA)} h`;

  const dias = Math.floor(diff / MS_POR_DIA);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} d`;

  // A partir de una semana conviene la fecha concreta antes que "hace 23 d".
  return fecha.toLocaleDateString("es", { day: "numeric", month: "short" });
}
