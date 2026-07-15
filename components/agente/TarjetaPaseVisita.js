// components/agente/TarjetaPaseVisita.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import QRCode from "react-native-qrcode-svg";
import ActionCard from "./ActionCard";
import CampoTarjeta from "./CampoTarjeta";
import { COLORS, SIZES } from "../../constants";

const TAMANO_QR = 120;

/**
 * Pase temporal del visitante, con QR y ventana de validez.
 *
 * El QR es un placeholder de demo: codifica el texto de `tarjeta.codigoQR`, que
 * hoy genera el mock. No es un pase verificable — el módulo de accesos real
 * (services/accesosService.js) valida contra el backend, y esto no pasa por ahí.
 *
 * @param {object} props
 * @param {Tarjeta} props.tarjeta - Además de lo común:
 *   { codigoQR, validoHasta, campos }.
 * @param {(actionId: string) => void} props.onAccion
 */
export default function TarjetaPaseVisita({ tarjeta, onAccion }) {
  return (
    <ActionCard
      titulo={tarjeta.titulo || "Pase temporal para el visitante"}
      icono="qr-code"
      colorAcento={COLORS.primary}
      esSimulacion={tarjeta.esSimulacion}
      acciones={tarjeta.acciones}
      onAccion={onAccion}
    >
      <View style={styles.contenido}>
        <View
          style={styles.qrMarco}
          accessible
          accessibilityLabel={`Código QR del pase, válido hasta las ${tarjeta.validoHasta}`}
        >
          <QRCode
            value={tarjeta.codigoQR || "TORRESEGURA-DEMO"}
            size={TAMANO_QR}
            color={COLORS.black}
            backgroundColor={COLORS.white}
          />
        </View>

        <View style={styles.datos}>
          {(tarjeta.campos || []).map((campo) => (
            <CampoTarjeta
              key={campo.etiqueta}
              icono={campo.icono}
              etiqueta={campo.etiqueta}
              valor={campo.valor}
            />
          ))}
        </View>
      </View>

      {/* Validez: es el dato que decide si el pase sirve o no ahora mismo. */}
      {!!tarjeta.validoHasta && (
        <View style={styles.validez}>
          <Icon name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.validezTexto}>
            Válida hasta las {tarjeta.validoHasta}
          </Text>
        </View>
      )}
    </ActionCard>
  );
}

const styles = StyleSheet.create({
  contenido: {
    flexDirection: "row",
    alignItems: "center",
  },
  qrMarco: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 6,
  },
  datos: {
    // flex: 1 + minWidth 0: sin esto los campos largos desbordan la tarjeta
    // en vez de recortarse.
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  validez: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.success}1A`,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
  },
  validezTexto: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    fontWeight: "600",
    color: COLORS.success,
    marginLeft: 6,
  },
});
