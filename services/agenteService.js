// services/agenteService.js
//
// Cliente del agente conversacional (Huáscar), contra los endpoints REALES ya
// desplegados. Usa el apiClient centralizado (Bearer + refresh automáticos).
//
// Contrato (verificado en vivo):
//   GET  /agente/acciones/health/              → { healthy, provider, model, status }
//   POST /agente/acciones/chat/                 body { message, thread_id? }
//        → { thread_id, message, intent, status, requires_confirmation, action_id,
//            confirmation:{ summary, expires_in_seconds, ... }, trace_metadata }
//   POST /agente/acciones/<action_id>/confirmar/  (sin body) — ESTO ejecuta la acción
//        → { estado, verification_status, resultado:{ status, reservation_id?,
//            reservation_status?, incident_id?, incident_status? }, backend_reference }
//
// Seguridad: confirmar es un endpoint dedicado; un "sí" por chat NO confirma
// nada (lo maneja un guardrail del backend). La UI solo debe llamar a
// confirmarAccionAgente() desde el botón de la tarjeta de resumen.

import { api, normalizeApiError } from "./apiClient";

/**
 * Envuelve el error de axios conservando `.status` (para distinguir vencimiento
 * 400/409/410, no-residente 403, etc.) y `.message` legible.
 */
function toRichError(err) {
  const { status, data, message } = normalizeApiError(err);
  const error = new Error(message);
  error.status = status;
  error.data = data;
  return error;
}

/**
 * Estado del LLM del agente. Úsalo para decidir si el chat real está disponible.
 * @returns {Promise<{healthy: boolean, provider?, model?, status?}>}
 */
export async function healthAgente() {
  try {
    const { data } = await api.get("/agente/acciones/health/");
    return data;
  } catch (err) {
    throw toRichError(err);
  }
}

/**
 * Envía un mensaje del usuario al agente.
 *
 * @param {object} params
 * @param {string} params.message   - Texto del usuario.
 * @param {string} [params.threadId] - Hilo del turno anterior (memoria de la conversación).
 * @returns {Promise<object>} La respuesta cruda del agente (ver contrato arriba).
 */
export async function enviarMensajeAgente({ message, threadId } = {}) {
  try {
    const body = { message };
    if (threadId) body.thread_id = threadId;
    const { data } = await api.post("/agente/acciones/chat/", body);
    return data;
  } catch (err) {
    throw toRichError(err);
  }
}

/**
 * Confirma (EJECUTA) una acción pendiente. Única vía válida de confirmación.
 *
 * @param {number|string} actionId - El `action_id` que devolvió el chat.
 * @returns {Promise<object>} Resultado de la ejecución (ver contrato arriba).
 */
export async function confirmarAccionAgente(actionId) {
  try {
    const { data } = await api.post(`/agente/acciones/${actionId}/confirmar/`);
    return data;
  } catch (err) {
    throw toRichError(err);
  }
}
