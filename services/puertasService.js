import { api, normalizeApiError } from "./apiClient";

// Puertas que el usuario autenticado puede abrir (según su rol)
export async function listarPuertas() {
  try {
    const response = await api.get("/accesos/puertas/");
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function abrirPuerta(puertaId) {
  try {
    const response = await api.post(`/accesos/puertas/${puertaId}/abrir/`);
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    const error = new Error(normalized.message);
    error.status = normalized.status;
    error.data = normalized.data;
    throw error;
  }
}

export async function historialAperturas() {
  try {
    const response = await api.get("/accesos/puertas/aperturas/");
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}
