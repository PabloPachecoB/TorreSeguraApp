import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Icon from "@expo/vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import { ROLES } from "../constants/roles";
import { listarAlertasEdificio } from "../services/alertasService";
import { listarAnuncios, crearAnuncio, votarAnuncio } from "../services/anunciosService";
import { getNotificacionesIncidencia } from "../services/incidenciasService";

// ─── Config visual ───────────────────────────────────────────────────

const ALERTA_CONFIG = {
  Incendio: { icon: "flame-outline", color: "#EF4444" },
  Sismo: { icon: "earth-outline", color: "#F59E0B" },
  Seguridad: { icon: "shield-outline", color: "#3B82F6" },
  Salud: { icon: "medkit-outline", color: "#10B981" },
  "Aviso importante": { icon: "megaphone-outline", color: "#8B5CF6" },
  "Reunión": { icon: "people-outline", color: "#06B6D4" },
};

const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", color: "#F59E0B", bg: "#FEF3C7" },
  en_proceso: { label: "En proceso", color: "#3B82F6", bg: "#DBEAFE" },
  resuelto: { label: "Resuelto", color: "#10B981", bg: "#D1FAE5" },
};

const ANUNCIO_ICON = {
  general: "megaphone-outline",
  mantenimiento: "construct-outline",
  reunion: "people-outline",
  evento: "calendar-outline",
  reglas: "document-text-outline",
  financiero: "cash-outline",
};

const CATEGORIAS = [
  { id: "general", label: "General" },
  { id: "mantenimiento", label: "Mantenimiento" },
  { id: "reunion", label: "Reunion" },
  { id: "evento", label: "Evento" },
  { id: "reglas", label: "Reglas" },
  { id: "financiero", label: "Financiero" },
];

// ─── Helpers ─────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffH < 24) return `Hace ${diffH}h`;
  if (diffD < 7) return `Hace ${diffD}d`;
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short" });
};

const formatDeadline = (dateStr) => {
  if (!dateStr) return "Sin limite";
  const d = new Date(dateStr);
  const now = new Date();
  if (d <= now) return "Finalizada";
  const diffMs = d - now;
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffD > 0) return `${diffD}d ${diffH % 24}h restantes`;
  if (diffH > 0) return `${diffH}h restantes`;
  return `${Math.floor(diffMs / 60000)} min restantes`;
};

const getAuthorName = (info) => {
  if (!info) return "Sistema";
  if (info.first_name || info.last_name)
    return `${info.first_name || ""} ${info.last_name || ""}`.trim();
  return info.username || "Usuario";
};

// ─── Componente principal ────────────────────────────────────────────

export default function NotificationsScreen({ navigation }) {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState("alertas");
  const [alertas, setAlertas] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [votingId, setVotingId] = useState(null); // ID de anuncio que se está votando

  // Modal crear anuncio
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoContenido, setNuevoContenido] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("general");
  const [creando, setCreando] = useState(false);

  // Votación en modal
  const [esVotacion, setEsVotacion] = useState(false);
  const [votoAnonimo, setVotoAnonimo] = useState(false);
  const [opcionesTexto, setOpcionesTexto] = useState(["", ""]);
  const [diasCierre, setDiasCierre] = useState("7");

  const userRole = user?.role || user?.rol?.nombre;
  const isGerente = userRole === ROLES.GERENTE;
  const canCreateVotacion = isGerente || userRole === "Administrador";

  useEffect(() => {
    if (!user || !user.username || !user.role) navigation.replace("Login");
  }, [user, navigation]);

  const loadData = useCallback(async () => {
    try {
      if (activeTab === "alertas") {
        const [data, incidentNotifications] = await Promise.all([
          listarAlertasEdificio(),
          getNotificacionesIncidencia(),
        ]);
        const workflowAlerts = incidentNotifications.map((notification) => ({
          id: `incidencia-${notification.id}`,
          tipo: "Incidencia",
          descripcion: notification.mensaje,
          fecha: notification.fecha,
          estado: notification.tipo === "ORDEN_APROBADA" ? "resuelto" : "en_proceso",
          enviado_por_info: { username: "Asistente TorreSegura" },
          incidencia_id: notification.incidencia_id,
        }));
        setAlertas([...(Array.isArray(data) ? data : []), ...workflowAlerts]);
      } else {
        const data = await listarAnuncios();
        setAnuncios(Array.isArray(data) ? data : []);
      }
      setLoadError(false);
    } catch (e) {
      if (__DEV__) console.warn("Error cargando:", e?.message);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // ─── Crear anuncio/votación ────────────────────────────────────────

  const resetModal = () => {
    setModalVisible(false);
    setNuevoTitulo("");
    setNuevoContenido("");
    setNuevaCategoria("general");
    setEsVotacion(false);
    setVotoAnonimo(false);
    setOpcionesTexto(["", ""]);
    setDiasCierre("7");
  };

  const handleCrearAnuncio = async () => {
    if (!nuevoTitulo.trim() || !nuevoContenido.trim()) {
      Alert.alert("Error", "Completa el titulo y el contenido.");
      return;
    }
    if (esVotacion) {
      const valid = opcionesTexto.filter((o) => o.trim());
      if (valid.length < 2) {
        Alert.alert("Error", "Necesitas al menos 2 opciones de voto.");
        return;
      }
    }

    setCreando(true);
    try {
      const dias = parseInt(diasCierre, 10) || 7;
      const cierre = new Date();
      cierre.setDate(cierre.getDate() + dias);

      await crearAnuncio({
        titulo: nuevoTitulo.trim(),
        contenido: nuevoContenido.trim(),
        categoria: nuevaCategoria,
        es_votacion: esVotacion,
        voto_anonimo: votoAnonimo,
        fecha_cierre_votacion: esVotacion ? cierre.toISOString() : null,
        opciones: esVotacion ? opcionesTexto.filter((o) => o.trim()) : [],
      });
      resetModal();
      loadData();
    } catch (e) {
      Alert.alert("Error", e.message || "No se pudo crear el anuncio.");
    } finally {
      setCreando(false);
    }
  };

  const addOpcion = () => {
    if (opcionesTexto.length < 6) setOpcionesTexto([...opcionesTexto, ""]);
  };

  const removeOpcion = (idx) => {
    if (opcionesTexto.length > 2) setOpcionesTexto(opcionesTexto.filter((_, i) => i !== idx));
  };

  const updateOpcion = (idx, text) => {
    const copy = [...opcionesTexto];
    copy[idx] = text;
    setOpcionesTexto(copy);
  };

  // ─── Votar ─────────────────────────────────────────────────────────

  const handleVotar = async (anuncioId, opcionId) => {
    setVotingId(anuncioId);
    try {
      const updated = await votarAnuncio(anuncioId, opcionId);
      setAnuncios((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (e) {
      Alert.alert("Error", e.message || "No se pudo registrar tu voto.");
    } finally {
      setVotingId(null);
    }
  };

  // ─── Render alerta ─────────────────────────────────────────────────

  const renderAlerta = ({ item }) => {
    const cfg = ALERTA_CONFIG[item.tipo] || { icon: "alert-circle-outline", color: COLORS.primary };
    const est = ESTADO_CONFIG[item.estado] || ESTADO_CONFIG.pendiente;
    return (
      <View style={[styles.card, { borderLeftColor: cfg.color }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: cfg.color + "15" }]}>
            <Icon name={cfg.icon} size={22} color={cfg.color} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{item.tipo}</Text>
            <Text style={styles.cardTime}>{formatDate(item.fecha)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: est.bg }]}>
            <Text style={[styles.badgeText, { color: est.color }]}>{est.label}</Text>
          </View>
        </View>
        <Text style={styles.cardBody}>{item.descripcion}</Text>
        <View style={styles.cardFooter}>
          <Icon name="person-outline" size={14} color={COLORS.gray} />
          <Text style={styles.footerText}>{getAuthorName(item.enviado_por_info)}</Text>
        </View>
      </View>
    );
  };

  // ─── Render anuncio + votación ─────────────────────────────────────

  const renderAnuncio = ({ item }) => {
    const icon = ANUNCIO_ICON[item.categoria] || "megaphone-outline";
    const isVotacion = item.es_votacion;
    const abierta = item.votacion_abierta;
    const miVoto = item.mi_voto;
    const totalVotos = item.total_votos || 0;
    const borderColor = isVotacion ? "#8B5CF6" : COLORS.secondary;

    return (
      <View style={[styles.card, { borderLeftColor: borderColor }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: borderColor + "20" }]}>
            <Icon name={isVotacion ? "bar-chart-outline" : icon} size={22} color={borderColor} />
          </View>
          <View style={styles.cardHeaderText}>
            <View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
              {item.fijado && <Icon name="pin" size={14} color={COLORS.primary} style={{ marginLeft: 6 }} />}
            </View>
            <Text style={styles.cardTime}>
              {item.categoria_display} - {formatDate(item.fecha_creacion)}
            </Text>
          </View>
          {isVotacion && (
            <View style={[styles.badge, { backgroundColor: abierta ? "#EDE9FE" : "#F3F4F6" }]}>
              <Text style={[styles.badgeText, { color: abierta ? "#7C3AED" : COLORS.gray }]}>
                {abierta ? "Abierta" : "Cerrada"}
              </Text>
            </View>
          )}
        </View>

        {/* Body */}
        <Text style={styles.cardBody}>{item.contenido}</Text>

        {/* Votación */}
        {isVotacion && item.opciones && item.opciones.length > 0 && (
          <View style={styles.votacionContainer}>
            {/* Timer + info */}
            <View style={styles.votacionMeta}>
              <View style={styles.votacionMetaItem}>
                <Icon name="time-outline" size={14} color={COLORS.gray} />
                <Text style={styles.votacionMetaText}>{formatDeadline(item.fecha_cierre_votacion)}</Text>
              </View>
              <View style={styles.votacionMetaItem}>
                <Icon name="people-outline" size={14} color={COLORS.gray} />
                <Text style={styles.votacionMetaText}>{totalVotos} voto{totalVotos !== 1 ? "s" : ""}</Text>
              </View>
              {item.voto_anonimo && (
                <View style={styles.votacionMetaItem}>
                  <Icon name="eye-off-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.votacionMetaText}>Anonima</Text>
                </View>
              )}
            </View>

            {/* Opciones */}
            {item.opciones.map((opcion) => {
              const isSelected = miVoto === opcion.id;
              const pct = totalVotos > 0 ? Math.round((opcion.cantidad_votos / totalVotos) * 100) : 0;
              const isLoadingThis = votingId === item.id;

              return (
                <TouchableOpacity
                  key={opcion.id}
                  style={[styles.opcionBtn, isSelected && styles.opcionBtnSelected]}
                  onPress={() => abierta && !isLoadingThis && handleVotar(item.id, opcion.id)}
                  disabled={!abierta || isLoadingThis}
                  activeOpacity={0.7}
                >
                  {/* Barra de progreso de fondo */}
                  <View style={[styles.opcionProgress, { width: `${pct}%` }]} />

                  <View style={styles.opcionContent}>
                    <View style={styles.opcionLeft}>
                      {isSelected ? (
                        <Icon name="checkmark-circle" size={20} color={COLORS.primary} />
                      ) : (
                        <Icon name="ellipse-outline" size={20} color={COLORS.gray} />
                      )}
                      <Text style={[styles.opcionText, isSelected && styles.opcionTextSelected]}>
                        {opcion.texto}
                      </Text>
                    </View>
                    <View style={styles.opcionRight}>
                      <Text style={styles.opcionCount}>{opcion.cantidad_votos}</Text>
                      <Text style={styles.opcionPct}>{pct}%</Text>
                    </View>
                  </View>

                  {/* Lista de votantes (solo si no es anónima) */}
                  {!item.voto_anonimo && opcion.votos && opcion.votos.length > 0 && (
                    <View style={styles.votantesList}>
                      {opcion.votos.map((v) => (
                        <View key={v.id} style={styles.votanteChip}>
                          <Icon name="person-circle-outline" size={14} color={COLORS.gray} />
                          <Text style={styles.votanteText}>
                            {getAuthorName(v.usuario_info)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {miVoto && <Text style={styles.yaVotoText}>Ya votaste - toca otra opcion para cambiar</Text>}
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Icon name="person-outline" size={14} color={COLORS.gray} />
          <Text style={styles.footerText}>{getAuthorName(item.autor_info)}</Text>
        </View>
      </View>
    );
  };

  // ─── Empty state ───────────────────────────────────────────────────

  const EmptyState = ({ icon, title, subtitle }) => (
    <View style={styles.emptyContainer}>
      <Icon name={icon} size={60} color={COLORS.border} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="cloud-offline-outline" size={60} color={COLORS.border} />
      <Text style={styles.emptyTitle}>No se pudo cargar</Text>
      <Text style={styles.emptySubtitle}>Revisa tu conexión e intenta de nuevo.</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => { setLoading(true); loadData(); }}
      >
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  if (!user || !user.username || !user.role) return null;

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-back-outline" size={26} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { id: "alertas", icon: "warning-outline", label: "Alertas" },
          { id: "anuncios", icon: "megaphone-outline", label: "Anuncios" },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Icon name={t.icon} size={18} color={activeTab === t.id ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : activeTab === "alertas" ? (
        <FlatList
          data={alertas}
          renderItem={renderAlerta}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={loadError ? <ErrorState /> : <EmptyState icon="shield-checkmark-outline" title="Sin alertas" subtitle="No hay alertas registradas en tu edificio." />}
        />
      ) : (
        <FlatList
          data={anuncios}
          renderItem={renderAnuncio}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={loadError ? <ErrorState /> : <EmptyState icon="newspaper-outline" title="Sin anuncios" subtitle="No hay anuncios publicados en tu edificio." />}
        />
      )}

      {/* FAB */}
      {activeTab === "anuncios" && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Icon name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* ─── Modal crear anuncio / votación ─────────────────────────── */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={resetModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {esVotacion ? "Nueva Votacion" : "Nuevo Anuncio"}
              </Text>
              <TouchableOpacity onPress={resetModal}>
                <Icon name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Titulo</Text>
              <TextInput
                style={styles.input}
                placeholder={esVotacion ? "Ej: Instalacion de segundo ascensor" : "Ej: Corte de agua programado"}
                placeholderTextColor="#9CA3AF"
                value={nuevoTitulo}
                onChangeText={setNuevoTitulo}
                maxLength={200}
              />

              <Text style={styles.inputLabel}>{esVotacion ? "Descripcion de la propuesta" : "Contenido"}</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Describe el detalle..."
                placeholderTextColor="#9CA3AF"
                value={nuevoContenido}
                onChangeText={setNuevoContenido}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Categoria</Text>
              <View style={styles.categoriaGrid}>
                {CATEGORIAS.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoriaChip, nuevaCategoria === cat.id && styles.categoriaChipActive]}
                    onPress={() => setNuevaCategoria(cat.id)}
                  >
                    <Icon name={ANUNCIO_ICON[cat.id]} size={14} color={nuevaCategoria === cat.id ? COLORS.white : COLORS.gray} />
                    <Text style={[styles.categoriaChipText, nuevaCategoria === cat.id && styles.categoriaChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Toggle votación (solo Gerente/Admin) */}
              {canCreateVotacion && (
                <>
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchLabel}>Incluir votacion</Text>
                      <Text style={styles.switchHint}>Los propietarios podran votar</Text>
                    </View>
                    <Switch
                      value={esVotacion}
                      onValueChange={setEsVotacion}
                      trackColor={{ false: "#D1D5DB", true: COLORS.primary + "80" }}
                      thumbColor={esVotacion ? COLORS.primary : "#F3F4F6"}
                    />
                  </View>

                  {esVotacion && (
                    <View style={styles.votacionForm}>
                      {/* Anonimato */}
                      <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.switchLabel}>Votacion anonima</Text>
                          <Text style={styles.switchHint}>No se mostrara quien voto</Text>
                        </View>
                        <Switch
                          value={votoAnonimo}
                          onValueChange={setVotoAnonimo}
                          trackColor={{ false: "#D1D5DB", true: COLORS.primary + "80" }}
                          thumbColor={votoAnonimo ? COLORS.primary : "#F3F4F6"}
                        />
                      </View>

                      {/* Dias de cierre */}
                      <Text style={styles.inputLabel}>Dias para votar</Text>
                      <View style={styles.diasRow}>
                        {["1", "3", "7", "14", "30"].map((d) => (
                          <TouchableOpacity
                            key={d}
                            style={[styles.diaChip, diasCierre === d && styles.diaChipActive]}
                            onPress={() => setDiasCierre(d)}
                          >
                            <Text style={[styles.diaChipText, diasCierre === d && styles.diaChipTextActive]}>
                              {d}d
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Opciones de voto */}
                      <Text style={styles.inputLabel}>Opciones de voto</Text>
                      {opcionesTexto.map((opt, idx) => (
                        <View key={idx} style={styles.opcionInputRow}>
                          <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            placeholder={`Opcion ${idx + 1}`}
                            placeholderTextColor="#9CA3AF"
                            value={opt}
                            onChangeText={(t) => updateOpcion(idx, t)}
                            maxLength={200}
                          />
                          {opcionesTexto.length > 2 && (
                            <TouchableOpacity style={styles.removeOpcionBtn} onPress={() => removeOpcion(idx)}>
                              <Icon name="close-circle" size={22} color={COLORS.error} />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      {opcionesTexto.length < 6 && (
                        <TouchableOpacity style={styles.addOpcionBtn} onPress={addOpcion}>
                          <Icon name="add-circle-outline" size={20} color={COLORS.primary} />
                          <Text style={styles.addOpcionText}>Agregar opcion</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}

              {/* Botones */}
              <TouchableOpacity
                style={[styles.btnPrimary, creando && { opacity: 0.6 }]}
                onPress={handleCrearAnuncio}
                disabled={creando}
              >
                {creando ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon name={esVotacion ? "bar-chart-outline" : "megaphone-outline"} size={18} color={COLORS.white} />
                    <Text style={[styles.btnPrimaryText, { marginLeft: 8 }]}>
                      {esVotacion ? "Publicar Votacion" : "Publicar Anuncio"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={resetModal}>
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SIZES.padding, paddingVertical: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.fontSizeTitle, fontFamily: "Roboto-Bold", color: COLORS.black },

  // Tabs
  tabBar: {
    flexDirection: "row", backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: COLORS.gray, marginLeft: 6 },
  tabTextActive: { color: COLORS.primary, fontFamily: "Roboto-Bold" },

  list: { padding: SIZES.padding, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Cards
  card: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12,
    borderLeftWidth: 4, shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  cardHeaderText: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", color: COLORS.black, flexShrink: 1 },
  cardTime: { fontSize: SIZES.fontSizeSmall, fontFamily: "Roboto-Regular", color: COLORS.gray, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  badgeText: { fontSize: 11, fontFamily: "Roboto-Bold" },
  cardBody: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: "#374151", lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  footerText: { fontSize: SIZES.fontSizeSmall, fontFamily: "Roboto-Regular", color: COLORS.gray, marginLeft: 4 },

  // Votación inline
  votacionContainer: { marginBottom: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 12 },
  votacionMeta: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10, gap: 12 },
  votacionMetaItem: { flexDirection: "row", alignItems: "center" },
  votacionMetaText: { fontSize: 12, fontFamily: "Roboto-Regular", color: COLORS.gray, marginLeft: 4 },

  opcionBtn: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10,
    marginBottom: 8, overflow: "hidden", position: "relative",
  },
  opcionBtnSelected: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  opcionProgress: {
    position: "absolute", top: 0, left: 0, bottom: 0,
    backgroundColor: COLORS.primary + "10", borderRadius: 10,
  },
  opcionContent: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12,
  },
  opcionLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  opcionText: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: COLORS.black, marginLeft: 10 },
  opcionTextSelected: { fontFamily: "Roboto-Bold", color: COLORS.primary },
  opcionRight: { flexDirection: "row", alignItems: "center" },
  opcionCount: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", color: COLORS.black, marginRight: 4 },
  opcionPct: { fontSize: SIZES.fontSizeSmall, fontFamily: "Roboto-Regular", color: COLORS.gray },

  votantesList: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, paddingBottom: 10, gap: 6 },
  votanteChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F3F4F6", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  votanteText: { fontSize: 11, fontFamily: "Roboto-Regular", color: COLORS.gray, marginLeft: 3 },

  yaVotoText: { fontSize: 11, fontFamily: "Roboto-Regular", color: COLORS.gray, textAlign: "center", marginTop: 4 },

  // Empty
  emptyContainer: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: SIZES.fontSizeSubtitle, fontFamily: "Roboto-Bold", color: COLORS.gray, marginTop: 16 },
  emptySubtitle: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: COLORS.gray, marginTop: 6, textAlign: "center", paddingHorizontal: 40 },
  retryButton: {
    marginTop: 16, backgroundColor: COLORS.primary,
    paddingVertical: 10, paddingHorizontal: 28, borderRadius: 8,
  },
  retryButtonText: { color: COLORS.white, fontFamily: "Roboto-Bold", fontWeight: "bold", fontSize: SIZES.fontSizeBody },

  // FAB
  fab: {
    position: "absolute", bottom: 85, right: 20,
    backgroundColor: COLORS.primary, width: 56, height: 56, borderRadius: 28,
    justifyContent: "center", alignItems: "center",
    shadowColor: COLORS.black, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: SIZES.padding, maxHeight: "90%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: SIZES.fontSizeTitle, fontFamily: "Roboto-Bold", color: COLORS.black },

  // Form
  inputLabel: { fontSize: SIZES.fontSizeSmall, fontFamily: "Roboto-Bold", color: COLORS.black, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: "#F3F4F6", borderRadius: 10, padding: 12,
    fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: COLORS.black,
    marginBottom: 14, borderWidth: 1, borderColor: "#E5E7EB",
  },
  inputMultiline: { height: 90, textAlignVertical: "top" },
  categoriaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, gap: 8 },
  categoriaChip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB",
  },
  categoriaChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoriaChipText: { fontSize: SIZES.fontSizeSmall, fontFamily: "Roboto-Regular", color: COLORS.gray, marginLeft: 5 },
  categoriaChipTextActive: { color: COLORS.white, fontFamily: "Roboto-Bold" },

  // Switch rows
  switchRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  switchLabel: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", color: COLORS.black },
  switchHint: { fontSize: 12, fontFamily: "Roboto-Regular", color: COLORS.gray, marginTop: 2 },

  // Votación form
  votacionForm: { marginTop: 4, marginBottom: 8 },
  diasRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  diaChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB",
  },
  diaChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  diaChipText: { fontSize: SIZES.fontSizeSmall, fontFamily: "Roboto-Bold", color: COLORS.gray },
  diaChipTextActive: { color: COLORS.white },

  opcionInputRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  removeOpcionBtn: { marginLeft: 8, padding: 4 },
  addOpcionBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, marginBottom: 14 },
  addOpcionText: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: COLORS.primary, marginLeft: 6 },

  // Buttons
  btnPrimary: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 10, marginTop: 8 },
  btnPrimaryText: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", color: COLORS.white },
  btnSecondary: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  btnSecondaryText: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: COLORS.gray },
});
