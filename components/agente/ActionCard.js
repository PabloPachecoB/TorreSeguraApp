// components/agente/ActionCard.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import CustomButton from "../CustomButton";
import { COLORS, SIZES } from "../../constants";

/**
 * Contenedor base de todas las tarjetas de acción del asistente.
 * No sabe nada de reservas, incidencias ni visitas: recibe título, contenido
 * (children) y una lista de acciones, y se encarga del marco visual.
 *
 * @param {object} props
 * @param {string} props.titulo
 * @param {string} [props.icono] - Ionicons, junto al título.
 * @param {string} [props.colorAcento=COLORS.primary] - Tiñe ícono y borde superior.
 *   Es lo que diferencia una tarjeta de éxito (verde) de una de error (rojo).
 * @param {{texto: string, color?: string}} [props.estado] - Badge a la derecha del título.
 * @param {string} [props.nota] - Aviso al pie, sobre fondo naranja suave.
 * @param {boolean} [props.esSimulacion=false] - Muestra el sello "Simulación".
 * @param {Accion[]} [props.acciones=[]] - { id, texto, variante, icono?, deshabilitada? }.
 *   variante: "primario" (azul lleno) | "secundario" (contorno).
 * @param {(id: string) => void} [props.onAccion] - Recibe el id de la acción tocada.
 * @param {boolean} [props.accionesOcupadas=false] - Pone las acciones en loading.
 * @param {React.ReactNode} props.children - Campos y contenido de la tarjeta.
 */
export default function ActionCard({
  titulo,
  icono,
  colorAcento = COLORS.primary,
  estado,
  nota,
  esSimulacion = false,
  acciones = [],
  onAccion,
  accionesOcupadas = false,
  children,
}) {
  return (
    <View style={[styles.tarjeta, { borderTopColor: colorAcento }]}>
      {/* Encabezado */}
      {!!titulo && (
        <View style={styles.encabezado}>
          {!!icono && (
            <View style={[styles.iconoContenedor, { backgroundColor: `${colorAcento}1A` }]}>
              <Icon name={icono} size={18} color={colorAcento} />
            </View>
          )}
          <Text style={styles.titulo} numberOfLines={2}>
            {titulo}
          </Text>
          {!!estado && (
            <View
              style={[styles.estadoBadge, { backgroundColor: estado.color || colorAcento }]}
            >
              <Text style={styles.estadoTexto}>{estado.texto}</Text>
            </View>
          )}
        </View>
      )}

      {/* Sello de simulación: va dentro de la tarjeta, no solo en el header del
          chat, porque es la tarjeta lo que se lee como si fuera real. */}
      {esSimulacion && (
        <View style={styles.selloSimulacion}>
          <Icon name="flask-outline" size={12} color={COLORS.gray} />
          <Text style={styles.selloTexto}>
            Simulación · esta acción no ejecuta nada real
          </Text>
        </View>
      )}

      <View style={styles.cuerpo}>{children}</View>

      {/* Nota al pie */}
      {!!nota && (
        <View style={styles.nota}>
          <Icon name="alert-circle-outline" size={14} color={COLORS.accent} />
          <Text style={styles.notaTexto}>{nota}</Text>
        </View>
      )}

      {/* Acciones */}
      {acciones.length > 0 && (
        <View style={styles.acciones}>
          {acciones.map((accion) => {
            const esPrimario = accion.variante !== "secundario";
            return (
              <CustomButton
                key={accion.id}
                text={accion.texto}
                icon={accion.icono}
                onPress={() => onAccion?.(accion.id)}
                disabled={accion.deshabilitada || accionesOcupadas}
                loading={accionesOcupadas && esPrimario}
                variant={esPrimario ? "primary" : "outline"}
                defaultColor={esPrimario ? colorAcento : COLORS.primary}
                textColor={COLORS.white}
                width="100%"
                height={44}
                borderRadius={10}
                fontSize={SIZES.fontSizeBody}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    // Franja superior de color: identifica el tipo de tarjeta de un vistazo.
    borderTopWidth: 3,
    padding: 14,
    marginBottom: 10,
    maxWidth: "92%",
    alignSelf: "flex-start",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconoContenedor: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  titulo: {
    flex: 1,
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.black,
  },
  estadoBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  estadoTexto: {
    fontSize: 11,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.white,
  },
  selloSimulacion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 10,
  },
  selloTexto: {
    fontSize: 11,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginLeft: 6,
    flexShrink: 1,
  },
  cuerpo: {
    marginTop: 6,
  },
  nota: {
    flexDirection: "row",
    alignItems: "flex-start",
    // Naranja al 10% sobre blanco: el aviso resalta sin gritar.
    backgroundColor: `${COLORS.accent}1A`,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  notaTexto: {
    flex: 1,
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginLeft: 6,
    lineHeight: 16,
  },
  acciones: {
    marginTop: 12,
    gap: 8,
  },
});
