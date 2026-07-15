// components/agente/TarjetaComprobante.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import ActionCard from "./ActionCard";
import CampoTarjeta from "./CampoTarjeta";
import { COLORS, SIZES } from "../../constants";

/**
 * Comprobante: el estado final y exitoso de un flujo. Verde, con check y código.
 * Es el último paso del patrón "conversar → resumen → confirmar → comprobante".
 *
 * @param {object} props
 * @param {Tarjeta} props.tarjeta - Además de lo común, acepta:
 *   { encabezadoExito: string, codigo: { etiqueta, valor } }.
 * @param {(actionId: string) => void} props.onAccion
 */
export default function TarjetaComprobante({ tarjeta, onAccion }) {
  return (
    <ActionCard
      titulo={tarjeta.titulo}
      icono={tarjeta.icono || "checkmark-circle"}
      colorAcento={COLORS.success}
      estado={tarjeta.estado}
      nota={tarjeta.nota}
      esSimulacion={tarjeta.esSimulacion}
      acciones={tarjeta.acciones}
      onAccion={onAccion}
    >
      {/* Confirmación visual grande: lo primero que se busca al llegar acá es
          "¿salió bien o no?", antes que cualquier dato. */}
      {!!tarjeta.encabezadoExito && (
        <View style={styles.exito}>
          <View style={styles.checkCirculo}>
            <Icon name="checkmark" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.exitoTexto}>{tarjeta.encabezadoExito}</Text>
        </View>
      )}

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

      {/* El código es el dato que el usuario va a buscar después (para reclamar,
          mostrar en portería, etc.), así que se destaca del resto. */}
      {!!tarjeta.codigo && (
        <View style={styles.codigo}>
          <Text style={styles.codigoEtiqueta}>{tarjeta.codigo.etiqueta}</Text>
          <Text style={styles.codigoValor} selectable>
            {tarjeta.codigo.valor}
          </Text>
        </View>
      )}
    </ActionCard>
  );
}

const styles = StyleSheet.create({
  exito: {
    alignItems: "center",
    paddingVertical: 10,
  },
  checkCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  exitoTexto: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.success,
    textAlign: "center",
  },
  codigo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${COLORS.success}1A`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  codigoEtiqueta: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
  },
  codigoValor: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.success,
    letterSpacing: 0.5,
  },
});
