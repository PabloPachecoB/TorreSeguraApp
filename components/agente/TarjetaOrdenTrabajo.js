import React from "react";
import ActionCard from "./ActionCard";
import CampoTarjeta from "./CampoTarjeta";
import { COLORS } from "../../constants";

export default function TarjetaOrdenTrabajo({ tarjeta }) {
  return (
    <ActionCard
      titulo={tarjeta.title || "Orden de trabajo"}
      icono="document-text-outline"
      colorAcento={COLORS.success}
      estado={{ texto: "Aprobada", color: COLORS.success }}
    >
      <CampoTarjeta etiqueta="ID de orden" valor={tarjeta.code} />
      <CampoTarjeta etiqueta="Categoría" valor={tarjeta.category} />
      <CampoTarjeta etiqueta="Prioridad" valor={tarjeta.priority} />
      <CampoTarjeta etiqueta="Técnico asignado" valor={tarjeta.technician || "Por asignar"} />
      <CampoTarjeta
        etiqueta="Programada para"
        valor={tarjeta.scheduled_start || "Pendiente de programación"}
      />
    </ActionCard>
  );
}
