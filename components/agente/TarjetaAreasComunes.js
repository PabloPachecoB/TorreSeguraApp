import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import ActionCard from "./ActionCard";
import { COLORS, SIZES } from "../../constants";

/** Renderiza `presentation.type=common_area_cards`. */
export default function TarjetaAreasComunes({
  tarjeta,
  onAccion,
  ocupada = false,
  resuelta = false,
}) {
  return (
    <View style={styles.lista}>
      {(tarjeta.areas || []).map((area) => (
        <ActionCard
          key={area.id}
          titulo={area.name}
          icono="business-outline"
          colorAcento={COLORS.primary}
          acciones={
            resuelta
              ? []
              : (area.actions || []).map((action, index) => ({
                  id: `${action.type}-${area.id}-${index}`,
                  texto: action.label,
                  icono:
                    action.type === "check_area_availability"
                      ? "time-outline"
                      : "calendar-outline",
                  variante: index === 0 ? "secundario" : "primario",
                  interaction: action,
                }))
          }
          onAccion={onAccion}
          accionesOcupadas={ocupada}
        >
          {!!area.description && (
            <Text style={styles.descripcion}>{area.description}</Text>
          )}
          <View style={styles.detalles}>
            <View style={styles.detalle}>
              <Icon name="people-outline" size={15} color={COLORS.gray} />
              <Text style={styles.detalleTexto}>
                Hasta {area.capacity} personas
              </Text>
            </View>
            <View style={styles.detalle}>
              <Icon name="time-outline" size={15} color={COLORS.gray} />
              <Text style={styles.detalleTexto}>
                {area.opening_time}–{area.closing_time}
              </Text>
            </View>
          </View>
        </ActionCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: {
    width: "100%",
  },
  descripcion: {
    color: COLORS.black,
    fontSize: SIZES.fontSizeBody,
    lineHeight: 19,
    marginBottom: 10,
  },
  detalles: {
    gap: 7,
  },
  detalle: {
    flexDirection: "row",
    alignItems: "center",
  },
  detalleTexto: {
    color: COLORS.gray,
    fontSize: SIZES.fontSizeSmall,
    marginLeft: 7,
  },
});
