import { api, normalizeApiError } from "./apiClient";

/**
 * Envía un mensaje al agente de incidencias y devuelve su respuesta.
 * Endpoint del agente (backend): POST /agente/chat/
 * Body: { mensaje, conversacion_id? } → { respuesta, conversacion_id }
 */
export async function enviarMensajeAgente({ mensaje, conversacionId } = {}) {
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
