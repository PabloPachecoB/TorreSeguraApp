import { api } from "./apiClient";

export async function obtenerCuotasPendientes() {
  const response = await api.get("/financiero/cuotas/pendientes/");
  return response.data;
}

export async function obtenerCuotasPagadas() {
  const response = await api.get("/financiero/cuotas/pagadas/");
  return response.data;
}

export async function obtenerMisPagos() {
  const response = await api.get("/financiero/pagos/");
  return response.data;
}

export async function registrarPago({ cuotaIds, metodoPago, referencia, notas }) {
  const response = await api.post("/financiero/pagos/registrar/", {
    cuota_ids: cuotaIds,
    metodo_pago: metodoPago,
    referencia: referencia || "",
    notas: notas || "",
  });
  return response.data;
}
