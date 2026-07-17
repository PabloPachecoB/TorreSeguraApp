// components/agente/CampoTarjeta.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import { COLORS, SIZES } from "../../constants";

/**
 * Fila de campo etiquetado dentro de una tarjeta: [ícono] Etiqueta ....... Valor
 * Es el patrón que se repite en todas las tarjetas del asistente
 * ("Categoría: Ventana", "Horario: 10:00 – 12:00").
 *
 * @param {object} props
 * @param {string} [props.icono] - Nombre de ícono Ionicons.
 * @param {string} props.etiqueta
 * @param {string} props.valor
 * @param {string} [props.colorValor] - Para resaltar un valor (ej. estado en verde).
 * @param {boolean} [props.puntoColor=false] - Antepone un punto de color al valor,
 *   como la prioridad "Media" del mockup de incidencia.
 */
export default function CampoTarjeta({
  icono,
  etiqueta,
  valor,
  colorValor,
  puntoColor = false,
}) {
  return (
    <View
      style={styles.fila}
      // El campo se lee como una sola unidad; si no, el lector de pantalla
      // dicta etiqueta y valor por separado y se pierde la relación.
      accessible
      accessibilityLabel={`${etiqueta}: ${valor}`}
    >
      {!!icono && (
        <Icon name={icono} size={16} color={COLORS.gray} style={styles.icono} />
      )}
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={styles.contenedorValor}>
        {puntoColor && (
          <View style={[styles.punto, { backgroundColor: colorValor || COLORS.gray }]} />
        )}
        <Text
          style={[styles.valor, !!colorValor && !puntoColor && { color: colorValor }]}
          numberOfLines={2}
        >
          {valor}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
  },
  icono: {
    marginRight: 8,
  },
  etiqueta: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginRight: 8,
  },
  contenedorValor: {
    // flex: 1 + alineación a la derecha: el valor ocupa el resto y no empuja
    // la etiqueta cuando es largo.
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  valor: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    fontWeight: "600",
    color: COLORS.black,
    textAlign: "right",
    flexShrink: 1,
  },
});
