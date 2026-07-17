// components/agente/TarjetaMensaje.js
import React from "react";
import TarjetaResumen from "./TarjetaResumen";
import TarjetaComprobante from "./TarjetaComprobante";
import TarjetaError from "./TarjetaError";
import TarjetaDisponibilidad from "./TarjetaDisponibilidad";
import TarjetaPaseVisita from "./TarjetaPaseVisita";
import TarjetaLlegadaVisita from "./TarjetaLlegadaVisita";

/**
 * Mapa tipo de tarjeta → componente.
 *
 * Este es el ÚNICO punto que hay que tocar para soportar un tipo nuevo: ni
 * ChatScreen ni los componentes se enteran. El contrato de `tarjeta` está
 * documentado en CONEXION_BACKEND.md.
 */
const COMPONENTES = {
  resumen: TarjetaResumen,
  comprobante: TarjetaComprobante,
  error: TarjetaError,
  disponibilidad: TarjetaDisponibilidad,
  pase: TarjetaPaseVisita,
  llegada: TarjetaLlegadaVisita,
};

/**
 * Renderiza la tarjeta que trae un mensaje del asistente.
 *
 * @param {object} props
 * @param {Tarjeta} props.tarjeta - Debe traer al menos `tipo`.
 * @param {(actionId: string) => void} props.onAccion
 * @param {boolean} [props.ocupada=false]
 * @param {boolean} [props.resuelta=false]
 * @returns {React.ReactElement|null} null si el tipo no se reconoce.
 */
export default function TarjetaMensaje({
  tarjeta,
  onAccion,
  ocupada = false,
  resuelta = false,
}) {
  if (!tarjeta?.tipo) return null;

  const Componente = COMPONENTES[tarjeta.tipo];

  // Tipo desconocido (ej. el backend agrega un flujo que esta versión de la app
  // todavía no conoce): no se rompe la pantalla. El texto del mensaje ya se
  // muestra igual en su burbuja, así que la conversación sigue teniendo sentido.
  if (!Componente) return null;

  return (
    <Componente
      tarjeta={tarjeta}
      onAccion={onAccion}
      ocupada={ocupada}
      resuelta={resuelta}
    />
  );
}
