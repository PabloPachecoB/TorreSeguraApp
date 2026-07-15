// constants/modulos.js
import { COLORS } from "./colors";

/**
 * Los cuatro flujos que resuelve el Asistente TorreSegura.
 * Cada uno tiene su etiqueta, ícono (Ionicons) y color de badge.
 * Los colores salen de la paleta existente — no se inventan tonos nuevos.
 */
export const MODULOS = {
  reserva: {
    etiqueta: "Reserva",
    icono: "calendar",
    color: COLORS.secondary,
  },
  incidencia: {
    etiqueta: "Incidencia",
    icono: "construct",
    color: COLORS.warning,
  },
  visita: {
    etiqueta: "Visita",
    icono: "people",
    color: COLORS.primary,
  },
  cerradura: {
    etiqueta: "Cerradura",
    icono: "lock-closed",
    color: COLORS.success,
  },
};

/** Módulo por defecto para conversaciones nuevas o con un módulo desconocido. */
export const MODULO_POR_DEFECTO = "incidencia";

/**
 * Devuelve la config de un módulo, con fallback seguro si el valor no se reconoce
 * (p. ej. si el backend agrega un módulo nuevo que la app todavía no conoce).
 */
export const getModulo = (clave) => MODULOS[clave] ?? MODULOS[MODULO_POR_DEFECTO];
