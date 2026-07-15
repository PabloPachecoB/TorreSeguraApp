// components/agente/BurbujaEscribiendo.js
import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { COLORS, SIZES } from "../../constants";

/**
 * Estado de carga del asistente ("El asistente está pensando…").
 * Antes vivía inline en ChatScreen; extraído para que cualquier pantalla del
 * agente lo use igual.
 *
 * @param {object} props
 * @param {string} [props.texto="El asistente está pensando…"]
 */
export default function BurbujaEscribiendo({
  texto = "El asistente está pensando…",
}) {
  return (
    <View
      style={styles.contenedor}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={texto}
    >
      <ActivityIndicator size="small" color={COLORS.primary} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  texto: {
    marginLeft: 8,
    color: COLORS.gray,
    fontFamily: "Roboto-Regular",
    fontSize: SIZES.fontSizeSmall + 1,
  },
});
