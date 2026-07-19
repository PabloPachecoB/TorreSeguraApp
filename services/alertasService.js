import { api, normalizeApiError } from "./apiClient";

export async function listarAlertas({ userId } = {}) {
  try {
    const params = {};
    if (userId) params.user_id = userId;
    const response = await api.get("/alertas/", { params });
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function listarAlertasEdificio() {
  try {
    const response = await api.get("/alertas/edificio/");
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function crearAlerta({ tipo, descripcion }) {
  try {
    const response = await api.post("/alertas/crear/", { tipo, descripcion });
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function crearAlertaViewset({ tipo, descripcion }) {
  try {
    const response = await api.post("/alertas/", { tipo, descripcion });
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

/**
 * Polling: obtener alertas nuevas del edificio creadas después de `since` (ISO string).
 */
export async function obtenerAlertasNuevas(since) {
  try {
    const response = await api.get("/alertas/nuevas/", {
      params: { since },
    });
    return response.data;
  } catch (err) {
    // Silenciar errores de polling para no molestar al usuario
    console.warn("Error polling alertas:", err.message);
    return [];
  }
}

