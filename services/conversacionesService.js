// services/conversacionesService.js
//
// Capa de acceso al historial de conversaciones del Asistente TorreSegura.
//
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANTE PARA CONECTAR EL BACKEND
// Hoy este archivo lee/escribe en AsyncStorage y se siembra desde
// data/mockConversaciones.js. NINGÚN componente de UI sabe de eso: todos pasan
// por las funciones exportadas aquí. Para conectar el backend real solo hay que
// reemplazar el cuerpo de estas funciones por llamadas a `api` (services/apiClient.js),
// respetando la firma y la forma de retorno. Ver CONEXION_BACKEND.md.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";
import { MOCK_CONVERSACIONES } from "../data/mockConversaciones";
// TODO: conectar endpoint real — descomentar cuando exista el backend.
// import { api, normalizeApiError } from "./apiClient";

/** Prefijo de la clave de AsyncStorage. El historial queda aislado por cuenta. */
const STORAGE_PREFIX = "historial_conversaciones_";

const claveDe = (userId) => `${STORAGE_PREFIX}${userId}`;

/** Más reciente arriba. */
const porFechaDesc = (a, b) =>
  new Date(b.actualizadaEn) - new Date(a.actualizadaEn);

/**
 * Lee el historial crudo de una cuenta desde AsyncStorage.
 * La primera vez lo siembra con las conversaciones de ejemplo del mock.
 * TODO: conectar endpoint real — esta función entera desaparece; el backend
 * pasa a ser la fuente de verdad y no hay que sembrar nada.
 */
async function leerHistorial(userId) {
  const crudo = await AsyncStorage.getItem(claveDe(userId));
  if (crudo) return JSON.parse(crudo);

  const semilla = MOCK_CONVERSACIONES.filter((c) => c.usuarioId === userId);
  await escribirHistorial(userId, semilla);
  return semilla;
}

/** Persiste el historial completo de una cuenta. */
async function escribirHistorial(userId, conversaciones) {
  await AsyncStorage.setItem(claveDe(userId), JSON.stringify(conversaciones));
}

/**
 * Lista las conversaciones de una cuenta, de la más reciente a la más antigua.
 *
 * @param {string} userId - Identificador de la cuenta activa.
 * @returns {Promise<Conversacion[]>} Conversaciones completas, ordenadas por `actualizadaEn` desc.
 *                                    Array vacío si la cuenta no tiene historial.
 */
export async function getConversaciones(userId) {
  if (!userId) return [];

  // TODO: conectar endpoint real — reemplazar por:
  //
  //   try {
  //     const { data } = await api.get("/agente/conversaciones/");
  //     return data.sort(porFechaDesc);
  //   } catch (err) {
  //     throw new Error(normalizeApiError(err).message);
  //   }
  //
  // Nota: el userId probablemente no viaje como parámetro — el backend lo deduce
  // del token (apiClient ya inyecta el Authorization). Si el endpoint lo pide,
  // sería api.get(`/agente/conversaciones/?usuario=${userId}`).
  const historial = await leerHistorial(userId);
  return [...historial].sort(porFechaDesc);
}

/**
 * Devuelve una conversación con todos sus mensajes.
 *
 * @param {string} userId - Cuenta activa (hoy hace falta para ubicar el historial local).
 * @param {string} id - Id de la conversación.
 * @returns {Promise<Conversacion|null>} La conversación, o null si no existe en esa cuenta.
 */
export async function getConversacion(userId, id) {
  if (!userId || !id) return null;

  // TODO: conectar endpoint real — reemplazar por:
  //
  //   try {
  //     const { data } = await api.get(`/agente/conversaciones/${id}/`);
  //     return data;
  //   } catch (err) {
  //     throw new Error(normalizeApiError(err).message);
  //   }
  //
  // Con backend real el parámetro userId sobra (el token identifica al dueño),
  // pero conviene dejarlo en la firma para no tocar los componentes.
  const historial = await leerHistorial(userId);
  return historial.find((c) => c.id === id) ?? null;
}

/**
 * Crea una conversación vacía para la cuenta activa.
 *
 * @param {string} userId - Cuenta activa.
 * @param {object} [opciones]
 * @param {string} [opciones.modulo="incidencia"] - reserva | incidencia | visita | cerradura.
 * @param {string} [opciones.titulo="Nueva conversación"] - Título provisional.
 * @returns {Promise<Conversacion>} La conversación recién creada, con `mensajes: []`.
 */
export async function crearConversacion(userId, opciones = {}) {
  const { modulo = "incidencia", titulo = "Nueva conversación" } = opciones;
  const ahora = new Date().toISOString();

  const nueva = {
    id: `conv-${Date.now()}`,
    usuarioId: userId,
    titulo,
    modulo,
    creadaEn: ahora,
    actualizadaEn: ahora,
    ultimoMensaje: "",
    mensajes: [],
  };

  // TODO: conectar endpoint real — reemplazar por:
  //
  //   try {
  //     const { data } = await api.post("/agente/conversaciones/", { modulo, titulo });
  //     return data; // el backend genera el id y las fechas
  //   } catch (err) {
  //     throw new Error(normalizeApiError(err).message);
  //   }
  const historial = await leerHistorial(userId);
  await escribirHistorial(userId, [nueva, ...historial]);
  return nueva;
}

/**
 * Agrega un mensaje a una conversación y actualiza su preview y fecha.
 * Si es el primer mensaje del usuario, lo usa como título de la conversación.
 *
 * @param {string} userId - Cuenta activa.
 * @param {string} id - Id de la conversación.
 * @param {Mensaje} mensaje - { id, rol, contenido, hora, tarjeta?, adjunto? }.
 * @returns {Promise<Conversacion|null>} La conversación actualizada, o null si no existe.
 */
export async function guardarMensaje(userId, id, mensaje) {
  if (!userId || !id) return null;

  // TODO: conectar endpoint real — probablemente NO haga falta llamar a nada aquí:
  // el endpoint del agente (POST /agente/chat/, ver agenteService.js) ya persiste
  // el mensaje del lado del servidor. En ese caso esta función se vuelve un no-op
  // y ChatScreen deja de llamarla. Si el backend expusiera un endpoint aparte sería:
  //
  //   await api.post(`/agente/conversaciones/${id}/mensajes/`, mensaje);
  const historial = await leerHistorial(userId);
  const indice = historial.findIndex((c) => c.id === id);
  if (indice === -1) return null;

  const conversacion = historial[indice];
  const esPrimerMensajeDelUsuario =
    mensaje.rol === "usuario" &&
    !conversacion.mensajes.some((m) => m.rol === "usuario");

  const actualizada = {
    ...conversacion,
    // El primer mensaje del usuario nombra la conversación, como en Claude/ChatGPT.
    titulo: esPrimerMensajeDelUsuario
      ? recortarTitulo(mensaje.contenido)
      : conversacion.titulo,
    mensajes: [...conversacion.mensajes, mensaje],
    ultimoMensaje: mensaje.contenido,
    actualizadaEn: new Date().toISOString(),
  };

  historial[indice] = actualizada;
  await escribirHistorial(userId, historial);
  return actualizada;
}

/**
 * Guarda el id de conversación que devuelve el agente (POST /agente/chat/, ver
 * agenteService.js) junto a la conversación local, para poder retomar el mismo
 * hilo del agente al reabrirla desde el historial.
 *
 * Hoy conviven dos ids: el local del historial (`id`) y el del agente
 * (`agenteConversacionId`). Cuando el backend exponga el historial serán el
 * mismo y esta función sobra.
 *
 * @param {string} userId - Cuenta activa.
 * @param {string} id - Id local de la conversación.
 * @param {string} agenteConversacionId - Id devuelto por el agente.
 * @returns {Promise<void>}
 */
export async function guardarIdAgente(userId, id, agenteConversacionId) {
  if (!userId || !id || !agenteConversacionId) return;

  // TODO: conectar endpoint real — eliminar esta función: con el historial en el
  // backend, la conversación ya nace con el id correcto y no hay dos ids que unir.
  const historial = await leerHistorial(userId);
  const indice = historial.findIndex((c) => c.id === id);
  if (indice === -1) return;
  if (historial[indice].agenteConversacionId === agenteConversacionId) return;

  historial[indice] = { ...historial[indice], agenteConversacionId };
  await escribirHistorial(userId, historial);
}

/**
 * Elimina una conversación de la cuenta activa.
 *
 * @param {string} userId - Cuenta activa.
 * @param {string} id - Id de la conversación.
 * @returns {Promise<boolean>} true si se eliminó, false si no existía.
 */
export async function eliminarConversacion(userId, id) {
  if (!userId || !id) return false;

  // TODO: conectar endpoint real — reemplazar por:
  //
  //   try {
  //     await api.delete(`/agente/conversaciones/${id}/`);
  //     return true;
  //   } catch (err) {
  //     throw new Error(normalizeApiError(err).message);
  //   }
  const historial = await leerHistorial(userId);
  const restantes = historial.filter((c) => c.id !== id);
  if (restantes.length === historial.length) return false;

  await escribirHistorial(userId, restantes);
  return true;
}

const LARGO_MAX_TITULO = 40;

/** Recorta el texto de un mensaje para usarlo como título del listado. */
function recortarTitulo(texto) {
  const limpio = texto.trim().replace(/\s+/g, " ");
  return limpio.length <= LARGO_MAX_TITULO
    ? limpio
    : `${limpio.slice(0, LARGO_MAX_TITULO).trimEnd()}…`;
}
