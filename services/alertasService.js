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
