import { api, normalizeApiError } from "./apiClient";

export async function obtenerAreas() {
  try {
    const response = await api.get("/areas-comunes/");
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
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
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function obtenerReservasArea(areaId) {
  try {
    const response = await api.get(`/areas-comunes/${areaId}/reservas/`);
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function obtenerMisReservas() {
  try {
    const response = await api.get("/areas-comunes/mis-reservas/");
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function cancelarReserva(reservaId) {
  try {
    const response = await api.patch(`/areas-comunes/reservas/${reservaId}/cancelar/`);
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}
