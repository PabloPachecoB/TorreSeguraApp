import { api, normalizeApiError } from "./apiClient";

/**
 * Convierte un error de axios en un Error con `status` y `data` adjuntos.
 *
 * Mantiene `.message` (para los `catch` que solo muestran texto) y además expone
 * `.status` y `.data` para que la UI pueda distinguir 400/403/404/409 y leer
 * `campos_faltantes` sin volver a parsear el error de axios.
 */
function toRichError(err) {
  const { status, data, message } = normalizeApiError(err);
  const error = new Error(message);
  error.status = status;
  error.data = data;
  return error;
}

export async function obtenerAreas() {
  try {
    const response = await api.get("/areas-comunes/");
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}

/**
 * Disponibilidad de un área para una fecha.
 *
 * GET /areas-comunes/<areaId>/disponibilidad/?fecha=YYYY-MM-DD&duracion_minutos=60
 *
 * @param {number|string} areaId
 * @param {string} fecha - "YYYY-MM-DD" (hoy o futura).
 * @param {number} [duracionMinutos=60]
 * @returns {Promise<{area, fecha_consultada, duracion_minutos,
 *   slots_disponibles: {hora_inicio, hora_fin}[], alternativas: any[]}>}
 *   Si `slots_disponibles` viene vacío, `alternativas` trae hasta 3 fechas
 *   futuras con horarios libres.
 */
export async function obtenerDisponibilidad(areaId, fecha, duracionMinutos = 60) {
  try {
    const response = await api.get(`/areas-comunes/${areaId}/disponibilidad/`, {
      params: { fecha, duracion_minutos: duracionMinutos },
    });
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}

export async function crearReserva(areaId, { fecha, hora_inicio, hora_fin, motivo }) {
  try {
    const response = await api.post(`/areas-comunes/${areaId}/reservar/`, {
      fecha,
      hora_inicio,
      hora_fin,
      motivo,
    });
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}

export async function obtenerReservasArea(areaId) {
  try {
    const response = await api.get(`/areas-comunes/${areaId}/reservas/`);
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}

export async function obtenerMisReservas() {
  try {
    const response = await api.get("/areas-comunes/mis-reservas/");
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}

export async function cancelarReserva(reservaId) {
  try {
    const response = await api.patch(`/areas-comunes/reservas/${reservaId}/cancelar/`);
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}
