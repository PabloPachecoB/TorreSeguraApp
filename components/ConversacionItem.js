// components/ConversacionItem.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import { COLORS, SIZES, getModulo } from "../constants";
import { fechaRelativa } from "../utils/fechaRelativa";

/**
 * Una fila del listado de historial: badge del módulo, título, fecha relativa
 * y preview del último mensaje.
 *
 * @param {object} props
 * @param {Conversacion} props.conversacion - Datos de la conversación.
 * @param {boolean} [props.activa=false] - Si es la conversación abierta ahora mismo.
 * @param {(id: string) => void} props.onSeleccionar
 * @param {(conversacion: Conversacion) => void} props.onEliminar
 */
export default function ConversacionItem({
  conversacion,
  activa = false,
  onSeleccionar,
  onEliminar,
}) {
  const modulo = getModulo(conversacion.modulo);

  return (
    <TouchableOpacity
      style={[styles.contenedor, activa && styles.contenedorActivo]}
      onPress={() => onSeleccionar(conversacion.id)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir conversación: ${conversacion.titulo}`}
      accessibilityState={{ selected: activa }}
    >
      {/* Badge circular del módulo, mismo lenguaje visual que el dashboard */}
      <View style={[styles.badge, { backgroundColor: modulo.color }]}>
        <Icon name={modulo.icono} size={16} color={COLORS.white} />
      </View>

      <View style={styles.cuerpo}>
        <View style={styles.filaSuperior}>
          <Text style={styles.titulo} numberOfLines={1}>
            {conversacion.titulo}
          </Text>
          <Text style={styles.fecha}>{fechaRelativa(conversacion.actualizadaEn)}</Text>
        </View>

        <Text style={[styles.modulo, { color: modulo.color }]}>{modulo.etiqueta}</Text>

        {!!conversacion.ultimoMensaje && (
          <Text style={styles.preview} numberOfLines={1}>
            {conversacion.ultimoMensaje}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={() => onEliminar(conversacion)}
        style={styles.botonEliminar}
        // Área táctil ampliada: el ícono solo es demasiado chico para el dedo.
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar conversación: ${conversacion.titulo}`}
      >
        <Icon name="trash-outline" size={16} color={COLORS.gray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  contenedorActivo: {
    backgroundColor: COLORS.background,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 2,
  },
  cuerpo: {
    flex: 1,
  },
  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
  },
  titulo: {
    flex: 1,
    fontSize: SIZES.fontSizeBody,
    fontWeight: "600",
    color: COLORS.black,
    marginRight: 6,
  },
  fecha: {
    fontSize: 11,
    color: COLORS.gray,
  },
  modulo: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  preview: {
    fontSize: SIZES.fontSizeSmall,
    color: COLORS.gray,
    marginTop: 3,
  },
  botonEliminar: {
    paddingLeft: 8,
    paddingTop: 4,
  },
});
