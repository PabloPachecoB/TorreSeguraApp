// services/incidenciasService.js
//
// Capa de acceso a incidencias (INC-06). A diferencia de las reservas, el alta
// de una incidencia va como multipart/form-data porque sube fotos de evidencia:
// si se manda JSON el backend responde 415. Ver la guía HU-03.1 del backend.
//
// Endpoints reales (bajo el baseURL `${API_BASE}/api/v1` de apiClient):
//   POST  /incidencias/crear/            (FormData)
//   GET   /incidencias/mis-incidencias/
//   GET   /incidencias/<id>/             (detalle: evidencias + eventos)

import { api, normalizeApiError } from "./apiClient";
import { appendAsset, removeContentType } from "./multipartAsset";

/** Categorías válidas del backend. La primera opción por defecto es OTRO. */
export const CATEGORIAS = [
  { valor: "PLOMERIA", etiqueta: "Plomería", icono: "water-outline" },
  { valor: "ELECTRICIDAD", etiqueta: "Electricidad", icono: "flash-outline" },
  { valor: "ASCENSOR", etiqueta: "Ascensor", icono: "swap-vertical-outline" },
  { valor: "SEGURIDAD", etiqueta: "Seguridad", icono: "shield-outline" },
  { valor: "LIMPIEZA", etiqueta: "Limpieza", icono: "sparkles-outline" },
  { valor: "OTRO", etiqueta: "Otro", icono: "ellipsis-horizontal-outline" },
];

export const CATEGORIA_DEFAULT = "OTRO";

/**
 * Convierte un error de axios en un Error con `status` y `data` adjuntos, para
 * que la UI pueda marcar en rojo los `campos_faltantes` (400), distinguir 403 de
 * 404, etc., sin re-parsear el error. Mantiene `.message` para los catch simples.
 */
function toRichError(err) {
  const { status, data, message } = normalizeApiError(err);
  const error = new Error(message);
  error.status = status;
  error.data = data;
  return error;
}

/**
 * Crea una incidencia con evidencia opcional (multipart/form-data).
 *
 * Reglas de la guía de Dilan que se respetan acá:
 *  - Cada archivo se agrega como { uri, name, type } (NO un File del web).
 *  - El campo `evidencias` se repite una vez por archivo (no un array serializado).
 *  - NO se fija `Content-Type` a mano: se deja que axios/RN pongan el boundary.
 *    (Si el backend diera un error de parseo, lo primero a probar es justamente
 *    seguir sin fijarlo — fijarlo mal rompe el multipart.)
 *
 * @param {object} params
 * @param {string} params.titulo         - Obligatorio.
 * @param {string} params.descripcion    - Obligatorio.
 * @param {string} [params.categoria]    - Una de CATEGORIAS; default OTRO.
 * @param {{uri, name?, fileName?, type?, mimeType?}[]} [params.archivos]
 * @returns {Promise<object>} La incidencia creada (con evidencias + eventos).
 */
export async function crearIncidencia({ titulo, descripcion, categoria, archivos = [] } = {}) {
  const formData = new FormData();
  formData.append("titulo", titulo);
  formData.append("descripcion", descripcion);
  if (categoria) formData.append("categoria", categoria);

  for (let i = 0; i < archivos.length; i += 1) {
    await appendAsset(
      formData, "evidencias", archivos[i],
      `evidencia-${Date.now()}-${i}.jpg`, "image/jpeg"
    );
  }

  try {
    // apiClient trae `Content-Type: application/json` por defecto. Con un body
    // FormData eso provoca un 415: el backend espera multipart. Y axios NO pisa
    // un Content-Type que ya viene puesto, así que hay que quitarlo aquí para que
    // React Native ponga `multipart/form-data` CON su boundary automático. No se
    // fija a mano (sin boundary se rompe el parseo). Vale siempre, con o sin
    // archivos: el body es FormData en ambos casos.
    const response = await api.post("/incidencias/crear/", formData, {
      transformRequest: (data, headers) => {
        removeContentType(headers);
        return data; // FormData tal cual; RN se encarga del multipart + boundary.
      },
    });
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}

/**
 * Últimas incidencias del residente autenticado (sin evidencias/timeline).
 * @returns {Promise<object[]>}
 */
export async function getMisIncidencias() {
  try {
    const response = await api.get("/incidencias/mis-incidencias/");
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}

/**
 * Detalle de una incidencia, con `evidencias` y `eventos` (timeline) completos.
 * Un id ajeno o inexistente devuelve 404 (por diseño no se distingue el caso).
 *
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function getIncidencia(id) {
  try {
    const response = await api.get(`/incidencias/${id}/`);
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}

export async function aprobarRevisionIncidencia(id, comentario = "") {
  try {
    const response = await api.post(`/incidencias/${id}/aprobar/`, { comentario });
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}

export async function solicitarRevisionIncidencia(id, comentario = "") {
  try {
    const response = await api.post(`/incidencias/${id}/solicitar-revision/`, {
      comentario,
    });
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}

export async function getNotificacionesIncidencia() {
  try {
    const response = await api.get("/incidencias/notificaciones/");
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    throw toRichError(err);
  }
}

export async function agregarEvidenciasIncidencia(id, archivos = []) {
  const formData = new FormData();
  for (let index = 0; index < archivos.length; index += 1) {
    await appendAsset(
      formData, "evidencias", archivos[index],
      `evidencia-${Date.now()}-${index}.jpg`, "image/jpeg"
    );
  }
  try {
    const response = await api.post(`/incidencias/${id}/evidencias/`, formData, {
      transformRequest: (data, headers) => {
        removeContentType(headers);
        return data;
      },
    });
    return response.data;
  } catch (err) {
    throw toRichError(err);
  }
}
