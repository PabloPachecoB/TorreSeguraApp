import { api, normalizeApiError } from "./apiClient";

export async function crearVisita({
  nombre_visitante,
  documento_visitante,
  vivienda_destino_id,
  motivo,
}) {
  try {
    const response = await api.post("/accesos/visitas/crear/", {
      nombre_visitante,
      documento_visitante,
      vivienda_destino_id,
      motivo,
    });
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function verificarQR({ id, firma, nonce }) {
  try {
    const response = await api.post("/accesos/visitas/verificar-qr/", {
      id,
      firma,
      nonce,
    });
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    const error = new Error(normalized.message);
    error.status = normalized.status;
    error.data = normalized.data;
    throw error;
  }
}
