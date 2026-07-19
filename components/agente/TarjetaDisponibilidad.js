// components/agente/TarjetaDisponibilidad.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import ActionCard from "./ActionCard";
import { COLORS, SIZES } from "../../constants";

/** Ids de acción que emite esta tarjeta. */
export const ACCION_RESERVAR = "reservar_slot";
/** Elegir un horario alternativo emite `${ACCION_ELEGIR_HORARIO}:${slotId}`. */
export const ACCION_ELEGIR_HORARIO = "elegir_horario";

/**
 * Disponibilidad de un área común: el horario encontrado, las reglas del área y
 * los horarios alternativos del mismo día.
 *
 * Es la única tarjeta propia del flujo de reserva; la confirmación y el
 * comprobante salen de los componentes genéricos (TarjetaResumen / TarjetaComprobante).
 *
 * @param {object} props
 * @param {Tarjeta} props.tarjeta - Además de lo común:
 *   { area, icono, horarioTexto, personas, reglas: [{icono, texto}],
 *     horariosAlternativos: [{ id, texto }] }.
 * @param {(actionId: string) => void} props.onAccion
 * @param {boolean} [props.ocupada=false]
 * @param {boolean} [props.resuelta=false] - Ya se eligió horario: se ocultan las acciones.
 */
export default function TarjetaDisponibilidad({
  tarjeta,
  onAccion,
  ocupada = false,
  resuelta = false,
}) {
  const alternativos = tarjeta.horariosAlternativos || [];

  return (
    <ActionCard
      titulo={tarjeta.titulo}
      icono={tarjeta.icono || "calendar"}
      colorAcento={COLORS.secondary}
      nota={tarjeta.nota}
      esSimulacion={tarjeta.esSimulacion}
      acciones={
        resuelta
          ? []
          : [
              {
                id: ACCION_RESERVAR,
                texto: tarjeta.textoAccion || "Reservar este horario",
                variante: "primario",
              },
            ]
      }
      onAccion={onAccion}
      accionesOcupadas={ocupada}
    >
      {/* Cabecera del slot encontrado */}
      <View style={styles.slot}>
        <Text style={styles.slotHorario}>{tarjeta.horarioTexto}</Text>
        {!!tarjeta.personas && (
          <View style={styles.slotPersonas}>
            <Icon name="people" size={14} color={COLORS.gray} />
            <Text style={styles.slotPersonasTexto}>
              {tarjeta.personas} {tarjeta.personas === 1 ? "persona" : "personas"}
            </Text>
          </View>
        )}
      </View>

      {/* Reglas del área */}
      {(tarjeta.reglas || []).length > 0 && (
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Reglas del área</Text>
          <View style={styles.reglas}>
            {tarjeta.reglas.map((regla) => (
              <View key={regla.texto} style={styles.regla}>
                <Icon name={regla.icono} size={13} color={COLORS.gray} />
                <Text style={styles.reglaTexto}>{regla.texto}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Horarios alternativos: se ocultan si la tarjeta ya se resolvió, para no
          invitar a cambiar algo que ya está decidido. */}
      {!resuelta && alternativos.length > 0 && (
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Otros horarios disponibles ese día</Text>
          <View style={styles.alternativos}>
            {alternativos.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={styles.chipHorario}
                onPress={() => onAccion?.(`${ACCION_ELEGIR_HORARIO}:${slot.id}`)}
                disabled={ocupada}
                accessibilityRole="button"
                accessibilityLabel={`Elegir el horario ${slot.texto}`}
              >
                <Icon name="time-outline" size={14} color={COLORS.primary} />
                <Text style={styles.chipHorarioTexto}>{slot.texto}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ActionCard>
  );
}

const styles = StyleSheet.create({
  slot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  slotHorario: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.black,
  },
  slotPersonas: {
    flexDirection: "row",
    alignItems: "center",
  },
  slotPersonasTexto: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginLeft: 4,
  },
  seccion: {
    marginTop: 12,
  },
  seccionTitulo: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Medium",
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 6,
  },
  reglas: {
    // flexWrap: las reglas son de largo variable y deben bajar de línea solas
    // en pantallas angostas en vez de recortarse.
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  regla: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  reglaTexto: {
    fontSize: 11,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginLeft: 4,
  },
  alternativos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipHorario: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipHorarioTexto: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Medium",
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 5,
  },
});
