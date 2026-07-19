import { api, normalizeApiError } from "./apiClient";

export async function listarAnuncios() {
  try {
    const response = await api.get("/alertas/anuncios/");
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function crearAnuncio({
  titulo,
  contenido,
  categoria,
  es_votacion,
  voto_anonimo,
  fecha_cierre_votacion,
  opciones,
}) {
  try {
    const response = await api.post("/alertas/anuncios/crear/", {
      titulo,
      contenido,
      categoria: categoria || "general",
      es_votacion: es_votacion || false,
      voto_anonimo: voto_anonimo || false,
      fecha_cierre_votacion: fecha_cierre_votacion || null,
      opciones: opciones || [],
    });
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function votarAnuncio(anuncioId, opcionId) {
  try {
    const response = await api.post(`/alertas/anuncios/${anuncioId}/votar/`, {
      opcion_id: opcionId,
    });
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function eliminarAnuncio(id) {
  try {
    const response = await api.delete(`/alertas/anuncios/${id}/eliminar/`);
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}
