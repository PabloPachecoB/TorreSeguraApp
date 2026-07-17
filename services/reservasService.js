// services/reservasService.js
//
// Capa de acceso a las reservas de áreas comunes del asistente.
//
// Misma convención que services/conversacionesService.js: la UI solo llama a
// estas funciones, nunca al mock. Para conectar el backend se reemplaza el
// cuerpo de cada una por llamadas a `api`. Ver CONEXION_BACKEND.md.

import {
  MOCK_AREAS,
  MOCK_SLOTS,
  MOCK_FECHAS,
  siguienteCodigoReserva,
} from "../data/mockReservas";
// TODO: conectar endpoint real — descomentar cuando exista el backend.
// import { api, normalizeApiError } from "./apiClient";

/** Latencia simulada, para que el estado de carga del chat se vea de verdad. */
const DEMORA_MS = 700;
const esperar = (ms = DEMORA_MS) => new Promise((r) => setTimeout(r, ms));

/**
 * Lista las áreas comunes con sus reglas.
 *
 * @returns {Promise<Area[]>} - { id, nombre, icono, reglas[] }.
 */
export async function getAreas() {
  // TODO: conectar endpoint real — reemplazar por:
  //   const { data } = await api.get("/areas/");
  //   return data;
  await esperar(200);
  return MOCK_AREAS;
}

/**
 * Busca un área por id o por nombre aproximado (lo que escribió el usuario).
 *
 * @param {string} texto
 * @returns {Promise<Area|null>}
 */
export async function buscarArea(texto) {
  if (!texto) return null;
  const termino = texto.toLowerCase();

  // TODO: conectar endpoint real — con backend esto sería
  //   api.get(`/areas/?buscar=${encodeURIComponent(texto)}`)
  // o directamente lo resolvería el agente del lado del servidor.
  await esperar(150);
  return (
    MOCK_AREAS.find((a) => termino.includes(a.id) || termino.includes(a.nombre.toLowerCase())) ??
    null
  );
}

/**
 * Disponibilidad de un área para un día.
 *
 * @param {object} params
 * @param {string} params.areaId
 * @param {string} params.dia - "jueves", en minúsculas.
 * @param {number} [params.personas]
 * @returns {Promise<{area, dia, fecha, slots: Slot[]}|null>} null si el área no existe.
 *   `slots` viene vacío si ese día no hay nada libre.
 */
export async function getDisponibilidad({ areaId, dia, personas } = {}) {
  // TODO: conectar endpoint real — reemplazar por:
  //
  //   try {
  //     const { data } = await api.get("/areas/disponibilidad/", {
  //       params: { area: areaId, dia, personas },
  //     });
  //     return data;
  //   } catch (err) {
  //     throw new Error(normalizeApiError(err).message);
  //   }
  await esperar();

  const area = MOCK_AREAS.find((a) => a.id === areaId);
  if (!area) return null;

  const slots = MOCK_SLOTS.filter(
    (s) => s.areaId === areaId && (!dia || s.dia === dia) && (!personas || s.capacidad >= personas)
  );

  return {
    area,
    dia,
    fecha: MOCK_FECHAS[dia] || dia,
    slots,
  };
}

/**
 * Confirma la reserva de un slot.
 *
 * @param {object} params
 * @param {string} params.slotId
 * @param {number} [params.personas]
 * @returns {Promise<Reserva>} - { codigo, area, fecha, horario, personas, estado }.
 * @throws {Error} Si el slot no existe.
 */
export async function confirmarReserva({ slotId, personas } = {}) {
  // TODO: conectar endpoint real — reemplazar por:
  //
  //   try {
  //     const { data } = await api.post("/reservas/", { slot: slotId, personas });
  //     return data; // el backend genera el código de reserva
  //   } catch (err) {
  //     throw new Error(normalizeApiError(err).message);
  //   }
  await esperar();

  const slot = MOCK_SLOTS.find((s) => s.id === slotId);
  // El error se propaga a propósito: la UI debe mostrar la tarjeta de error,
  // no inventar un comprobante.
  if (!slot) throw new Error("El horario ya no está disponible.");

  const area = MOCK_AREAS.find((a) => a.id === slot.areaId);

  return {
    codigo: siguienteCodigoReserva(),
    area: area?.nombre ?? slot.areaId,
    areaIcono: area?.icono ?? "calendar",
    dia: slot.dia,
    fecha: MOCK_FECHAS[slot.dia] || slot.dia,
    horario: slot.horario,
    personas: personas ?? 1,
    estado: "Confirmada",
  };
}
