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

export async function obtenerHistorialAccesos(search = "") {
  try {
    const params = {};
    if (search) params.search = search;
    const response = await api.get("/visitantes/", { params });
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function eliminarInvitacion(id) {
  try {
    const response = await api.delete(`/visitantes/${id}/`);
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
