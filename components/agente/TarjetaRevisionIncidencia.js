import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import ActionCard from "./ActionCard";
import CampoTarjeta from "./CampoTarjeta";
import { COLORS, SIZES } from "../../constants";

const roles = {
  RESIDENTE: "Residente",
  ADMINISTRADOR: "Administrador",
  TECNICO: "Técnico",
};

export default function TarjetaRevisionIncidencia({ tarjeta, onAccion, ocupada, resuelta }) {
  const evaluation = tarjeta.evaluation || {};
  return (
    <ActionCard
      titulo={tarjeta.title || "Revisión del trabajo"}
      icono="people-circle-outline"
      estado={{ texto: "En revisión", color: COLORS.accent }}
      nota="Los cambios de costo, tiempo o prioridad requieren una nueva aprobación de las partes."
      acciones={tarjeta.can_resident_decide && !resuelta ? [
        { id: "aprobar_revision", texto: "Aprobar ajuste", icono: "checkmark" },
        { id: "solicitar_revision", texto: "Solicitar revisión", variante: "secundario" },
      ] : []}
      onAccion={onAccion}
      accionesOcupadas={ocupada}
    >
      <CampoTarjeta etiqueta="Reporte" valor={`#${tarjeta.incident_id}`} />
      <CampoTarjeta etiqueta="Versión" valor={`${tarjeta.version}`} />
      {!!tarjeta.technician && (
        <CampoTarjeta etiqueta="Técnico" valor={tarjeta.technician} />
      )}
      <View style={styles.timeline}>
        {(tarjeta.approvals || []).map((approval) => (
          <View key={approval.role} style={styles.paso}>
            <Icon
              name={approval.decision === "APROBADA" ? "checkmark-circle" : "refresh-circle"}
              size={20}
              color={approval.decision === "APROBADA" ? COLORS.success : COLORS.accent}
            />
            <View style={styles.pasoTexto}>
              <Text style={styles.rol}>{roles[approval.role] || approval.role}</Text>
              <Text style={styles.detalle}>
                {approval.decision === "APROBADA" ? "Aprobó" : "Solicitó revisión"}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <CampoTarjeta etiqueta="Prioridad actual" valor={evaluation.priority || "—"} />
      <CampoTarjeta
        etiqueta="Tiempo estimado"
        valor={evaluation.estimated_hours ? `${evaluation.estimated_hours} h` : "Pendiente"}
      />
    </ActionCard>
  );
}

const styles = StyleSheet.create({
  timeline: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 8, paddingTop: 8 },
  paso: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  pasoTexto: { marginLeft: 8 },
  rol: { fontSize: SIZES.fontSizeBody, fontWeight: "700", color: COLORS.black },
  detalle: { fontSize: SIZES.fontSizeSmall, color: COLORS.gray },
});
