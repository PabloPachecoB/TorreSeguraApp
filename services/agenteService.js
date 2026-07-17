import { api, normalizeApiError } from "./apiClient";
import { MODO_DEMO_AGENTE } from "../constants/config";
import { responderMensaje, responderAccion } from "./agenteSimulador";

/**
 * Envía un mensaje al agente y devuelve su respuesta.
 *
 * Con MODO_DEMO_AGENTE en true responde el simulador local; en false se usa el
 * endpoint real. Es un interruptor explícito, no un fallback: si el endpoint
 * falla, el error se propaga y la UI muestra la tarjeta de error. Nunca se
 * responde con datos simulados haciéndolos pasar por reales.
 *
 * Endpoint del agente (backend): POST /agente/chat/
 * Body: { mensaje, conversacion_id? } → { respuesta, conversacion_id }
 *
 * @param {object} params
 * @param {string} params.mensaje
 * @param {string} [params.conversacionId]
 * @param {object} [params.estadoDemo] - Estado del simulador. Se ignora fuera del modo demo.
 * @returns {Promise<{respuesta, conversacion_id?, tarjeta?, estado?}>}
 */
export async function enviarMensajeAgente({ mensaje, conversacionId, estadoDemo } = {}) {
  // TODO: conectar endpoint real — borrar esta rama junto con agenteSimulador.js.
  if (MODO_DEMO_AGENTE) {
    return responderMensaje({ mensaje, estado: estadoDemo });
  }

  try {
    const body = { mensaje };
    if (conversacionId) body.conversacion_id = conversacionId;
    const response = await api.post("/agente/chat/", body);
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

/**
 * Ejecuta la acción de una tarjeta (Confirmar, Cancelar, elegir horario…).
 *
 * @param {object} params
 * @param {string} params.actionId - Id declarado por la tarjeta.
 * @param {object} [params.estadoDemo]
 * @param {string} [params.usuarioId]
 * @param {string} [params.conversacionId]
 * @returns {Promise<{respuesta, tarjeta?, estado?}>}
 * @throws {Error} Fuera del modo demo, mientras no exista el endpoint.
 */
export async function ejecutarAccionAgente({
  actionId,
  estadoDemo,
  usuarioId,
  conversacionId,
} = {}) {
  // TODO: conectar endpoint real — borrar esta rama junto con agenteSimulador.js.
  if (MODO_DEMO_AGENTE) {
    return responderAccion({ actionId, estado: estadoDemo, usuarioId });
  }

  // TODO: conectar endpoint real — no invento la forma de este endpoint porque
  // todavía no está definida. Cuando exista, probablemente sea algo como:
  //
  //   try {
  //     const { data } = await api.post("/agente/accion/", {
  //       action_id: actionId,
  //       conversacion_id: conversacionId,
  //     });
  //     return data; // { respuesta, tarjeta? }
  //   } catch (err) {
  //     throw new Error(normalizeApiError(err).message);
  //   }
  //
  // Hasta entonces falla de forma explícita: es preferible un error visible a
  // que el usuario crea que su reserva quedó registrada cuando no pasó nada.
  throw new Error(
    "Las acciones del asistente todavía no están conectadas al backend."
  );
}
