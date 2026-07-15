// services/visitasService.js
//
// Capa de acceso a las visitas del asistente (VIS-01 — mockup / simulación).
//
// IMPORTANTE: esto NO registra visitas reales ni emite pases verificables. Es la
// capa de datos de la demo del asistente. El flujo real de accesos y QR vive en
// services/accesosService.js y no pasa por acá. Ver CONEXION_BACKEND.md.

import { MOCK_MOTIVOS, MOCK_VISITAS, siguienteCodigoPase } from "../data/mockVisitas";
// TODO: conectar endpoint real — descomentar cuando exista el backend.
// import { api, normalizeApiError } from "./apiClient";

const DEMORA_MS = 700;
const esperar = (ms = DEMORA_MS) => new Promise((r) => setTimeout(r, ms));

/** Estado en memoria de la demo. Se pierde al cerrar la app, a propósito:
 *  son datos de simulación y no deben sobrevivir como si fueran reales. */
const visitasDemo = [...MOCK_VISITAS];

/**
 * Motivos de visita disponibles.
 *
 * @returns {Promise<Motivo[]>} - { clave, etiqueta, icono }.
 */
export async function getMotivos() {
  // TODO: conectar endpoint real — reemplazar por:
  //   const { data } = await api.get("/visitas/motivos/");
  //   return data;
  await esperar(150);
  return MOCK_MOTIVOS;
}

/**
 * Crea la solicitud de autorización de visita (simulada).
 *
 * @param {object} params - { usuarioId, apartamento, motivo, motivoClave, fecha, horario, visitantes }.
 * @returns {Promise<Visita>} La visita en estado "registrada", con su código de pase.
 */
export async function crearSolicitudVisita(params = {}) {
  // TODO: conectar endpoint real — reemplazar por:
  //
  //   try {
  //     const { data } = await api.post("/visitas/", params);
  //     return data; // el backend genera id, pase y validez
  //   } catch (err) {
  //     throw new Error(normalizeApiError(err).message);
  //   }
  await esperar();

  const visita = {
    ...params,
    id: `vis-${Date.now()}`,
    codigoQR: siguienteCodigoPase(),
    validoHasta: (params.horario || "").split("–").pop()?.trim() || "12:00",
    estado: "registrada",
  };

  visitasDemo.unshift(visita);
  return visita;
}

/**
 * Devuelve una visita por id.
 *
 * @param {string} id
 * @returns {Promise<Visita|null>}
 */
export async function getVisita(id) {
  // TODO: conectar endpoint real — reemplazar por:
  //   const { data } = await api.get(`/visitas/${id}/`);
  //   return data;
  await esperar(150);
  return visitasDemo.find((v) => v.id === id) ?? null;
}

/**
 * Simula que el visitante llegó a la puerta.
 *
 * Existe SOLO para poder mostrar el paso de llegada en la demo. Con backend real
 * esto no es una función que llame la app: es un evento que empuja el servidor
 * (push / websocket) cuando portería registra la llegada.
 *
 * @param {string} id
 * @returns {Promise<Visita|null>} La visita en estado "en_puerta".
 */
export async function simularLlegadaVisitante(id) {
  // TODO: conectar endpoint real — BORRAR esta función. No tiene equivalente:
  // la llegada la notifica el servidor, no la pide la app.
  await esperar(400);

  const indice = visitasDemo.findIndex((v) => v.id === id);
  if (indice === -1) return null;

  visitasDemo[indice] = { ...visitasDemo[indice], estado: "en_puerta" };
  return visitasDemo[indice];
}

/**
 * Registra la decisión del residente sobre una llegada (simulada).
 *
 * @param {string} id
 * @param {"permitir"|"rechazar"} decision
 * @returns {Promise<Visita|null>} La visita en estado "autorizada" o "rechazada".
 */
export async function responderLlegada(id, decision) {
  // TODO: conectar endpoint real — reemplazar por:
  //
  //   try {
  //     const { data } = await api.post(`/visitas/${id}/decision/`, { decision });
  //     return data;
  //   } catch (err) {
  //     throw new Error(normalizeApiError(err).message);
  //   }
  await esperar();

  const indice = visitasDemo.findIndex((v) => v.id === id);
  if (indice === -1) return null;

  visitasDemo[indice] = {
    ...visitasDemo[indice],
    estado: decision === "permitir" ? "autorizada" : "rechazada",
  };
  return visitasDemo[indice];
}
