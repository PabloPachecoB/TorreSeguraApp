// components/agente/TarjetaLlegadaVisita.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import ActionCard from "./ActionCard";
import { COLORS, SIZES } from "../../constants";

/** Ids de acción que emite esta tarjeta. */
export const ACCION_PERMITIR = "permitir_ingreso";
export const ACCION_RECHAZAR = "rechazar_ingreso";

/**
 * Notificación de llegada del visitante, con la decisión de permitir o rechazar.
 * Es el momento "el repartidor está en la puerta" del mockup de visitantes.
 *
 * @param {object} props
 * @param {Tarjeta} props.tarjeta - { titulo, subtitulo, cuando, visitantes, esSimulacion }.
 * @param {(actionId: string) => void} props.onAccion
 * @param {boolean} [props.ocupada=false]
 * @param {boolean} [props.resuelta=false] - Ya se decidió: se ocultan los botones.
 */
export default function TarjetaLlegadaVisita({
  tarjeta,
  onAccion,
  ocupada = false,
  resuelta = false,
}) {
  return (
    <ActionCard
      titulo={tarjeta.titulo || "Notificación de entrada"}
      icono="notifications"
      colorAcento={COLORS.primary}
      esSimulacion={tarjeta.esSimulacion}
      acciones={
        resuelta
          ? []
          : [
              { id: ACCION_PERMITIR, texto: "Permitir ingreso", variante: "primario" },
              { id: ACCION_RECHAZAR, texto: "Rechazar", variante: "secundario" },
            ]
      }
      onAccion={onAccion}
      accionesOcupadas={ocupada}
    >
      {!!tarjeta.subtitulo && <Text style={styles.subtitulo}>{tarjeta.subtitulo}</Text>}

      <View style={styles.meta}>
        {!!tarjeta.cuando && (
          <View style={styles.metaItem}>
            <Icon name="time-outline" size={14} color={COLORS.gray} />
            <Text style={styles.metaTexto}>{tarjeta.cuando}</Text>
          </View>
        )}
        {!!tarjeta.visitantes && (
          <View style={styles.metaItem}>
            <Icon name="people" size={14} color={COLORS.gray} />
            <Text style={styles.metaTexto}>
              {tarjeta.visitantes}{" "}
              {tarjeta.visitantes === 1 ? "visitante" : "visitantes"}
            </Text>
          </View>
        )}
      </View>
    </ActionCard>
  );
}

const styles = StyleSheet.create({
  subtitulo: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginBottom: 8,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaTexto: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginLeft: 4,
  },
});
