import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import ActionCard from "./ActionCard";
import { COLORS, SIZES } from "../../constants";

/** Renderiza `presentation.type=availability_options`. */
export default function TarjetaOpcionesDisponibilidad({
  tarjeta,
  onAccion,
  ocupada = false,
  resuelta = false,
}) {
  return (
    <ActionCard
      titulo={tarjeta.title || "Horarios disponibles"}
      icono="calendar-outline"
      colorAcento={COLORS.secondary}
    >
      {!!tarjeta.area?.name && (
        <View style={styles.area}>
          <Icon name="business-outline" size={16} color={COLORS.primary} />
          <Text style={styles.areaTexto}>{tarjeta.area.name}</Text>
        </View>
      )}

      {(tarjeta.dates || []).map((dateOption) => (
        <View key={dateOption.date} style={styles.fecha}>
          <Text style={styles.fechaTitulo}>{dateOption.label}</Text>
          <Text style={styles.fechaIso}>{dateOption.date}</Text>
          <View style={styles.slots}>
            {(dateOption.slots || []).map((slot) => (
              <TouchableOpacity
                key={`${dateOption.date}-${slot.start_time}-${slot.end_time}`}
                style={[
                  styles.slot,
                  (ocupada || resuelta) && styles.slotDeshabilitado,
                ]}
                onPress={() => onAccion?.(slot.action)}
                disabled={ocupada || resuelta}
                accessibilityRole="button"
                accessibilityLabel={slot.action?.label || `Elegir ${slot.label}`}
              >
                <Icon name="time-outline" size={16} color={COLORS.primary} />
                <Text style={styles.slotTexto}>{slot.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {resuelta && (
        <View style={styles.seleccionada}>
          <Icon name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.seleccionadaTexto}>Opción seleccionada</Text>
        </View>
      )}
    </ActionCard>
  );
}

const styles = StyleSheet.create({
  area: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  areaTexto: {
    color: COLORS.black,
    fontSize: SIZES.fontSizeBody,
    fontWeight: "600",
    marginLeft: 7,
  },
  fecha: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 11,
    marginTop: 8,
  },
  fechaTitulo: {
    color: COLORS.black,
    fontSize: SIZES.fontSizeBody,
    fontWeight: "700",
  },
  fechaIso: {
    color: COLORS.gray,
    fontSize: 11,
    marginTop: 2,
  },
  slots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 9,
  },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.secondary}12`,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  slotDeshabilitado: {
    opacity: 0.45,
  },
  slotTexto: {
    color: COLORS.primary,
    fontSize: SIZES.fontSizeSmall,
    fontWeight: "700",
    marginLeft: 5,
  },
  seleccionada: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  seleccionadaTexto: {
    color: COLORS.success,
    fontSize: SIZES.fontSizeSmall,
    fontWeight: "600",
    marginLeft: 6,
  },
});
