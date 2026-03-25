/**
 * Centralized role definitions
 * Used throughout the app for consistent role checking
 */

export const ROLES = {
  VIGILANTE: "Vigilante",
  RESIDENTE: "Residente",
  GERENTE: "Gerente",
};

export const isVigilante = (role) => role === ROLES.VIGILANTE;
export const isResidente = (role) => role === ROLES.RESIDENTE;
export const isGerente = (role) => role === ROLES.GERENTE;
