// services/agenteService.js
//
// Cliente del agente conversacional (Huáscar), contra los endpoints REALES ya
// desplegados. Usa el apiClient centralizado (Bearer + refresh automáticos).
//
// Contrato (verificado en vivo):
//   GET  /agente/acciones/health/              → { healthy, provider, model, status }
//   POST /agente/acciones/chat/                 body { message?, interaction?, thread_id? }
//        → { thread_id, message, intent, status, requires_confirmation, action_id,
//            confirmation:{ summary, expires_in_seconds, ... }, trace_metadata }
//   POST /agente/acciones/<action_id>/confirmar/  (sin body) — ESTO ejecuta la acción
//        → { estado, verification_status, resultado:{ status, reservation_id?,
//            reservation_status?, incident_id?, incident_status? }, backend_reference }
//
// Seguridad: confirmar es un endpoint dedicado; un "sí" por chat NO confirma
// nada (lo maneja un guardrail del backend). La UI solo debe llamar a
// confirmarAccionAgente() desde el botón de la tarjeta de resumen.

import { API_BASE } from "@env";
import { api, normalizeApiError } from "./apiClient";
import { getAccessToken } from "./tokenStorage";
import { appendAsset } from "./multipartAsset";

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
export async function enviarMensajeAgente({ message, interaction, threadId } = {}) {
  try {
    const body = {};
    if (message) body.message = message;
    if (interaction) body.interaction = interaction;
    if (threadId) body.thread_id = threadId;
    // Qwen hace clasificación y extracción antes de responder. El timeout
    // específico del chat debe ser mayor que el global de las APIs CRUD.
    const { data } = await api.post("/agente/acciones/chat/", body, {
      timeout: 45000,
    });
    return data;
  } catch (err) {
    throw toRichError(err);
  }
}

/**
 * Envía una grabación al backend. Qwen3.5-Omni Plus la transcribe y el texto
 * resultante entra al mismo hilo conversacional que un mensaje escrito.
 */
export async function enviarAudioAgente({ audio, images = [], threadId } = {}) {
  const formData = new FormData();
  await appendAsset(
    formData,
    "audio",
    audio,
    `mensaje-voz-${Date.now()}.webm`,
    "audio/webm"
  );
  for (let index = 0; index < images.length; index += 1) {
    await appendAsset(
      formData,
      "images",
      images[index],
      `contexto-${Date.now()}-${index}.jpg`,
      "image/jpeg"
    );
  }
  if (threadId) formData.append("thread_id", threadId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  try {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE}/api/v1/agente/acciones/chat/`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      signal: controller.signal,
    });
    const raw = await response.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { detail: raw || "Respuesta inválida del backend." };
    }
    if (!response.ok) {
      const error = new Error(
        data?.detail || data?.error || `El servidor respondió ${response.status}.`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (err) {
    if (err?.name === "AbortError") {
      const timeoutError = new Error("La transcripción tardó demasiado. Inténtalo nuevamente.");
      timeoutError.status = null;
      throw timeoutError;
    }
    if (err?.status != null) throw err;
    throw toRichError(err);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Envía una acción de `presentation` sin convertirla nuevamente a texto.
 */
export async function enviarInteraccionAgente({ interaction, threadId } = {}) {
  return enviarMensajeAgente({ interaction, threadId });
}

/** Lista las acciones propias para recuperar una confirmación tras un timeout. */
export async function obtenerAccionesAgente() {
  try {
    const { data } = await api.get("/agente/acciones/");
    return Array.isArray(data) ? data : data?.results || [];
  } catch (err) {
    throw toRichError(err);
  }
}

/** Busca una acción pendiente del hilo sin asumir que el chat falló. */
export async function obtenerAccionPendienteAgente(threadId) {
  if (!threadId) return null;
  for (let intento = 0; intento < 3; intento += 1) {
    const acciones = await obtenerAccionesAgente();
    const pendiente = acciones.find(
      (accion) =>
        accion?.thread_id === threadId && accion?.estado === "PENDIENTE"
    );
    if (pendiente) return pendiente;
    if (intento < 2) {
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }
  return null;
}

/**
 * Confirma (EJECUTA) una acción pendiente. Única vía válida de confirmación.
 *
 * @param {number|string} actionId - El `action_id` que devolvió el chat.
 * @param {string} [password] - 2º factor obligatorio para acciones de cerradura
 *   (CERRADURA_ABRIR). Sin él, el backend responde 400 "debes reingresar tu
 *   contraseña". Para el resto de acciones se omite.
 * @returns {Promise<object>} Resultado de la ejecución (ver contrato arriba).
 */
export async function confirmarAccionAgente(actionId, password) {
  try {
    const body = password ? { password } : {};
    const { data } = await api.post(`/agente/acciones/${actionId}/confirmar/`, body);
    return data;
  } catch (err) {
    throw toRichError(err);
  }
}

/** Rechaza una acción pendiente para desbloquear correctamente el thread. */
export async function rechazarAccionAgente(actionId) {
  try {
    const { data } = await api.post(`/agente/acciones/${actionId}/rechazar/`);
    return data;
  } catch (err) {
    throw toRichError(err);
  }
}
