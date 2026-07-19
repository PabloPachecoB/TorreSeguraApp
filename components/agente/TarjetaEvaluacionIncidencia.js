import React from "react";
import ActionCard from "./ActionCard";
import CampoTarjeta from "./CampoTarjeta";
import { COLORS } from "../../constants";

const etiquetas = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

const colorPrioridad = (priority) =>
  priority === "CRITICA" || priority === "ALTA"
    ? COLORS.error
    : priority === "MEDIA"
    ? COLORS.accent
    : COLORS.success;

export default function TarjetaEvaluacionIncidencia({
  tarjeta,
  onAccion,
  ocupada,
  resuelta,
}) {
  const tieneCosto = tarjeta.estimated_cost_min != null;
  const costo = tieneCosto
    ? `${tarjeta.currency || "BOB"} ${tarjeta.estimated_cost_min}–${tarjeta.estimated_cost_max}`
    : "Pendiente de inspección";
  return (
    <ActionCard
      titulo={tarjeta.title || "Evaluación inicial"}
      icono="clipboard-outline"
      colorAcento={COLORS.primary}
      nota={tarjeta.note}
      acciones={resuelta ? [] : [
        { id: "confirmar", texto: "Crear reporte", icono: "checkmark" },
        { id: "cancelar", texto: "Cancelar", variante: "secundario" },
      ]}
      onAccion={onAccion}
      accionesOcupadas={ocupada}
    >
      <CampoTarjeta icono="folder" etiqueta="Categoría" valor={tarjeta.category} />
      <CampoTarjeta
        icono="flag"
        etiqueta="Prioridad"
        valor={etiquetas[tarjeta.priority] || tarjeta.priority}
        puntoColor
        colorValor={colorPrioridad(tarjeta.priority)}
      />
      <CampoTarjeta icono="cash-outline" etiqueta="Estimado" valor={costo} />
      <CampoTarjeta
        icono="time-outline"
        etiqueta="Tiempo"
        valor={`Hasta ${tarjeta.estimated_hours} h`}
      />
    </ActionCard>
  );
}
