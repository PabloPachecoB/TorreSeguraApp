import { api, normalizeApiError } from "./apiClient";

/**
 * Genera un QR de pago BNB para las cuotas seleccionadas.
 * @param {number[]} cuotaIds - IDs de las cuotas a pagar
 * @returns {{ qr_id, qr_image, monto, glosa, fecha_expiracion, mensaje }}
 */
export async function generarQRPago(cuotaIds) {
  try {
    const response = await api.post("/financiero/pagos/qr/generar/", {
      cuota_ids: cuotaIds,
    });
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

/**
 * Verifica el estado de un QR en BNB.
 * Si fue pagado, el backend crea el Pago automáticamente.
 * @param {string} qrId - ID del QR a verificar
 * @returns {{ qr_id, estado, pago_id?, monto?, mensaje }}
 */
export async function verificarQRPago(qrId) {
  try {
    const response = await api.get(`/financiero/pagos/qr/${qrId}/verificar/`);
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

/**
 * Lista los QRs activos (pendientes de pago) del residente.
 * @returns {Array<{ qr_id, monto, glosa, qr_image, fecha_expiracion, cuotas }>}
 */
export async function obtenerQRPendientes() {
  try {
    const response = await api.get("/financiero/pagos/qr/pendientes/");
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}
