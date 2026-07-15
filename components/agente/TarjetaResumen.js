// components/agente/TarjetaResumen.js
import React from "react";
import ActionCard from "./ActionCard";
import CampoTarjeta from "./CampoTarjeta";
import { COLORS } from "../../constants";

/**
 * Tarjeta de resumen: muestra lo que el asistente entendió y pide confirmación.
 * Es el paso "conversar → tarjeta de resumen → confirmar" del flujo.
 *
 * Genérica a propósito: sirve para la evaluación inicial de una incidencia, la
 * solicitud de visita o cualquier flujo futuro. Los datos vienen en `campos`.
 *
 * @param {object} props
 * @param {Tarjeta} props.tarjeta - { titulo, icono, campos, nota, acciones, estado, esSimulacion }.
 * @param {(actionId: string) => void} props.onAccion
 * @param {boolean} [props.ocupada=false] - Acción en curso (botones en loading).
 * @param {boolean} [props.resuelta=false] - Ya se confirmó o canceló: se ocultan
 *   las acciones para que no se pueda confirmar dos veces la misma tarjeta.
 */
export default function TarjetaResumen({
  tarjeta,
  onAccion,
  ocupada = false,
  resuelta = false,
}) {
  return (
    <ActionCard
      titulo={tarjeta.titulo}
      icono={tarjeta.icono || "document-text-outline"}
      colorAcento={COLORS.primary}
      estado={tarjeta.estado}
      nota={tarjeta.nota}
      esSimulacion={tarjeta.esSimulacion}
      acciones={resuelta ? [] : tarjeta.acciones}
      onAccion={onAccion}
      accionesOcupadas={ocupada}
    >
      {(tarjeta.campos || []).map((campo) => (
        <CampoTarjeta
          key={campo.etiqueta}
          icono={campo.icono}
          etiqueta={campo.etiqueta}
          valor={campo.valor}
          colorValor={campo.colorValor}
          puntoColor={campo.puntoColor}
        />
      ))}
    </ActionCard>
  );
}
