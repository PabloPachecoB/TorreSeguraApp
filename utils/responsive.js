// utils/responsive.js
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// Breakpoints para diferentes dispositivos
export const BREAKPOINTS = {
  SMALL: 480,   // Móviles pequeños
  MEDIUM: 768,  // Tablet pequeño
  LARGE: 1024,  // Tablet
};

export const isSmallDevice = width < BREAKPOINTS.SMALL;
export const isMediumDevice = width >= BREAKPOINTS.SMALL && width < BREAKPOINTS.MEDIUM;
export const isLargeDevice = width >= BREAKPOINTS.MEDIUM;

/**
 * Función para escalar valores responsivamente
 * @param {number} baseValue - Valor base para dispositivos normales
 * @param {number} smallDeviceValue - Valor para dispositivos pequeños (opcional)
 * @returns {number} Valor escalado
 */
export const responsiveValue = (baseValue, smallDeviceValue = baseValue * 0.85) => {
  return isSmallDevice ? smallDeviceValue : baseValue;
};

/**
 * Función para escalar tamaños de fuente responsivamente
 * @param {number} fontSize - Tamaño de fuente base
 * @returns {number} Tamaño de fuente escalado
 */
export const responsiveFontSize = (fontSize) => {
  return responsiveValue(fontSize, fontSize * 0.9);
};

/**
 * Función para escalar padding responsivamente
 * @param {number} padding - Padding base
 * @returns {number} Padding escalado
 */
export const responsivePadding = (padding) => {
  return responsiveValue(padding, padding * 0.75);
};

/**
 * Función para obtener ancho responsivo
 * @param {number} percentage - Porcentaje del ancho de pantalla
 * @returns {number} Ancho en píxeles
 */
export const responsiveWidth = (percentage) => {
  return (width * percentage) / 100;
};

/**
 * Función para obtener alto responsivo
 * @param {number} percentage - Porcentaje del alto de pantalla
 * @returns {number} Alto en píxeles
 */
export const responsiveHeight = (percentage) => {
  return (height * percentage) / 100;
};

// Exportar dimensiones originales
export const screenDimensions = { width, height };
