// components/agente/TarjetaError.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ActionCard from "./ActionCard";
import { COLORS, SIZES } from "../../constants";

/** Id de acción que emite el botón "Reintentar". */
export const ACCION_REINTENTAR = "reintentar";

/**
 * Tarjeta de error. Dice qué falló y ofrece reintentar.
 *
 * Nunca muestra un resultado parcial ni sugiere que la acción se completó:
 * si el usuario no puede distinguir un fallo de un éxito, va a asumir que su
 * reserva quedó hecha cuando no lo está.
 *
 * @param {object} props
 * @param {Tarjeta} props.tarjeta - { titulo?, mensaje, detalle?, permiteReintentar? }.
 * @param {(actionId: string) => void} props.onAccion
 * @param {boolean} [props.ocupada=false]
 */
export default function TarjetaError({ tarjeta, onAccion, ocupada = false }) {
  const permiteReintentar = tarjeta.permiteReintentar !== false;

  return (
    <ActionCard
      titulo={tarjeta.titulo || "No se pudo completar"}
      icono="alert-circle"
      colorAcento={COLORS.error}
      acciones={
        permiteReintentar
          ? [
              {
                id: ACCION_REINTENTAR,
                texto: "Reintentar",
                variante: "primario",
                icono: "refresh",
              },
            ]
          : []
      }
      onAccion={onAccion}
      accionesOcupadas={ocupada}
    >
      <Text style={styles.mensaje}>{tarjeta.mensaje}</Text>

      {/* Detalle técnico: útil para reportar el problema, pero secundario. */}
      {!!tarjeta.detalle && (
        <View style={styles.detalle}>
          <Text style={styles.detalleTexto} selectable>
            {tarjeta.detalle}
          </Text>
        </View>
      )}
    </ActionCard>
  );
}

const styles = StyleSheet.create({
  mensaje: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    lineHeight: 20,
  },
  detalle: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  detalleTexto: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
  },
});
