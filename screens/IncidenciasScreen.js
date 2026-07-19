// screens/IncidenciasScreen.js
//
// Reportar incidencias (INC-06) contra el backend real. Solo capa de datos +
// presentación: crear (multipart con foto de evidencia), listar y ver el
// detalle con su timeline. La foto de evidencia es un endpoint PROTEGIDO, así
// que se muestra pasándole el header Authorization, no como <Image> pelado.

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "@expo/vector-icons/Ionicons";
import { launchImageLibrary } from "react-native-image-picker";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { COLORS, SIZES } from "../constants";
import {
  crearIncidencia,
  getMisIncidencias,
  getIncidencia,
  CATEGORIAS,
  CATEGORIA_DEFAULT,
} from "../services/incidenciasService";
import { getAccessToken } from "../services/tokenStorage";
import TarjetaError from "../components/agente/TarjetaError";

const fmtFecha = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const estadoColor = (estado) => {
  switch ((estado || "").toUpperCase()) {
    case "RESUELTA":
    case "CERRADA":
      return COLORS.success;
    case "EN_PROCESO":
    case "EN PROCESO":
      return COLORS.accent;
    case "RECHAZADA":
      return COLORS.error;
    default:
      return COLORS.secondary; // REPORTADA
  }
};

export default function IncidenciasScreen({ navigation }) {
  const { selectedTab } = useNavigationContext();

  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Crear
  const [crearVisible, setCrearVisible] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIA_DEFAULT);
  const [archivos, setArchivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [camposFaltantes, setCamposFaltantes] = useState([]);
  const [crearError, setCrearError] = useState(null);

  // Detalle
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detalleError, setDetalleError] = useState(null);
  const [detalleId, setDetalleId] = useState(null);
  const [token, setToken] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const data = await getMisIncidencias();
      setIncidencias(Array.isArray(data) ? data : []);
    } catch {
      setIncidencias([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await cargar();
      setLoading(false);
    };
    init();
  }, [cargar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  }, [cargar]);

  // ─── Crear ─────────────────────────────────────────────────────────────────

  const resetCrear = () => {
    setTitulo("");
    setDescripcion("");
    setCategoria(CATEGORIA_DEFAULT);
    setArchivos([]);
    setCamposFaltantes([]);
    setCrearError(null);
  };

  const agregarFoto = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: "photo", selectionLimit: 0 });
      if (res?.didCancel) return;
      if (res?.assets?.length) {
        setArchivos((prev) => [...prev, ...res.assets]);
      }
    } catch {
      // Si el picker falla, no bloqueamos el reporte: la foto es opcional.
    }
  };

  const quitarFoto = (uri) => setArchivos((prev) => prev.filter((a) => a.uri !== uri));

  const enviar = async () => {
    setCrearError(null);
    setCamposFaltantes([]);

    // Validación local previa (el backend igual valida): evita un 400 obvio.
    const faltan = [];
    if (!titulo.trim()) faltan.push("titulo");
    if (!descripcion.trim()) faltan.push("descripcion");
    if (faltan.length) {
      setCamposFaltantes(faltan);
      setCrearError({
        tipo: "error",
        titulo: "Faltan datos",
        mensaje: "Completa los campos marcados en rojo.",
        permiteReintentar: false,
      });
      return;
    }

    setEnviando(true);
    try {
      await crearIncidencia({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        archivos,
      });
      setCrearVisible(false);
      resetCrear();
      await cargar();
    } catch (error) {
      const status = error?.status;
      const faltantes = error?.data?.campos_faltantes;

      if (status === 400 && Array.isArray(faltantes) && faltantes.length) {
        setCamposFaltantes(faltantes);
        setCrearError({
          tipo: "error",
          titulo: "Faltan datos",
          mensaje: `Revisa: ${faltantes.join(", ")}.`,
          permiteReintentar: false,
        });
      } else if (status === 403) {
        setCrearError({
          tipo: "error",
          titulo: "No autorizado",
          mensaje: "Solo los residentes pueden reportar incidencias.",
          permiteReintentar: false,
        });
      } else {
        setCrearError({
          tipo: "error",
          titulo: "No se pudo reportar",
          mensaje: error?.message || "Ocurrió un error. Intenta de nuevo.",
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  // ─── Detalle ───────────────────────────────────────────────────────────────

  const abrirDetalle = async (id) => {
    setDetalleVisible(true);
    setDetalle(null);
    setDetalleError(null);
    setDetalleId(id);
    setLoadingDetalle(true);
    // El token se necesita para el header de la foto protegida.
    getAccessToken().then(setToken);
    try {
      const data = await getIncidencia(id);
      setDetalle(data);
    } catch (error) {
      // 404 = id ajeno o inexistente (el backend no distingue, a propósito).
      setDetalleError({
        tipo: "error",
        titulo: "No se pudo abrir",
        mensaje:
          error?.status === 404
            ? "Esta incidencia no existe o no es tuya."
            : error?.message || "Intenta de nuevo.",
        permiteReintentar: error?.status !== 404,
      });
    } finally {
      setLoadingDetalle(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => abrirDetalle(item.id)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitulo} numberOfLines={1}>{item.titulo}</Text>
        <Text style={styles.itemCategoria}>{item.categoria_display || item.categoria}</Text>
        <Text style={styles.itemFecha}>{fmtFecha(item.fecha_creacion)}</Text>
      </View>
      <View style={[styles.estadoBadge, { backgroundColor: `${estadoColor(item.estado)}1A` }]}>
        <Text style={[styles.estadoTexto, { color: estadoColor(item.estado) }]}>
          {item.estado_display || item.estado}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color={COLORS.gray} />
    </TouchableOpacity>
  );

  const campoRojo = (campo) => camposFaltantes.includes(campo);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incidencias</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando incidencias...</Text>
        </View>
      ) : (
        <FlatList
          data={incidencias}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Icon name="clipboard-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No has reportado incidencias.</Text>
            </View>
          }
        />
      )}

      {/* FAB nueva incidencia */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => { resetCrear(); setCrearVisible(true); }}
        accessibilityRole="button"
        accessibilityLabel="Reportar nueva incidencia"
      >
        <Icon name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Modal Crear */}
      <Modal animationType="slide" transparent visible={crearVisible} onRequestClose={() => setCrearVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: "90%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reportar incidencia</Text>
              <TouchableOpacity onPress={() => setCrearVisible(false)}>
                <Icon name="close" size={26} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: "100%" }} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Título</Text>
              <TextInput
                style={[styles.input, campoRojo("titulo") && styles.inputError]}
                placeholder="Ej. Ascensor con ruido"
                placeholderTextColor={COLORS.gray}
                value={titulo}
                onChangeText={(t) => { setTitulo(t); if (campoRojo("titulo")) setCamposFaltantes((p) => p.filter((c) => c !== "titulo")); }}
              />

              <Text style={styles.fieldLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textarea, campoRojo("descripcion") && styles.inputError]}
                placeholder="Describe el problema con detalle"
                placeholderTextColor={COLORS.gray}
                value={descripcion}
                onChangeText={(t) => { setDescripcion(t); if (campoRojo("descripcion")) setCamposFaltantes((p) => p.filter((c) => c !== "descripcion")); }}
                multiline
              />

              <Text style={styles.fieldLabel}>Categoría</Text>
              <View style={styles.categoriaWrap}>
                {CATEGORIAS.map((cat) => {
                  const activo = categoria === cat.valor;
                  return (
                    <TouchableOpacity
                      key={cat.valor}
                      style={[styles.categoriaChip, activo && styles.categoriaChipActivo]}
                      onPress={() => setCategoria(cat.valor)}
                    >
                      <Icon name={cat.icono} size={14} color={activo ? COLORS.white : COLORS.primary} />
                      <Text style={[styles.categoriaTexto, activo && styles.categoriaTextoActivo]}>{cat.etiqueta}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Evidencia (opcional)</Text>
              <View style={styles.fotosWrap}>
                {archivos.map((a) => (
                  <View key={a.uri} style={styles.fotoThumbWrap}>
                    <Image source={{ uri: a.uri }} style={styles.fotoThumb} />
                    <TouchableOpacity style={styles.fotoQuitar} onPress={() => quitarFoto(a.uri)}>
                      <Icon name="close-circle" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.fotoAgregar} onPress={agregarFoto}>
                  <Icon name="camera-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.fotoAgregarTexto}>Agregar</Text>
                </TouchableOpacity>
              </View>

              {crearError && (
                <View style={{ marginTop: 12 }}>
                  <TarjetaError tarjeta={crearError} onAccion={() => setCrearError(null)} />
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, enviando && { opacity: 0.6 }]}
              onPress={enviar}
              disabled={enviando}
            >
              {enviando ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitBtnText}>Reportar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Detalle + timeline */}
      <Modal animationType="slide" transparent visible={detalleVisible} onRequestClose={() => setDetalleVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: "90%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle</Text>
              <TouchableOpacity onPress={() => setDetalleVisible(false)}>
                <Icon name="close" size={26} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            {loadingDetalle ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 30 }} />
            ) : detalleError ? (
              <View style={{ width: "100%" }}>
                <TarjetaError
                  tarjeta={detalleError}
                  onAccion={() => { if (detalleId != null) abrirDetalle(detalleId); }}
                />
              </View>
            ) : detalle ? (
              <ScrollView style={{ width: "100%" }}>
                <Text style={styles.detalleTitulo}>{detalle.titulo}</Text>
                <View style={[styles.estadoBadge, { alignSelf: "flex-start", backgroundColor: `${estadoColor(detalle.estado)}1A` }]}>
                  <Text style={[styles.estadoTexto, { color: estadoColor(detalle.estado) }]}>
                    {detalle.estado_display || detalle.estado}
                  </Text>
                </View>
                <Text style={styles.detalleMeta}>{detalle.categoria_display || detalle.categoria} · {fmtFecha(detalle.fecha_creacion)}</Text>
                <Text style={styles.detalleDescripcion}>{detalle.descripcion}</Text>

                {/* Evidencias — foto PROTEGIDA: va con el header Authorization. */}
                {Array.isArray(detalle.evidencias) && detalle.evidencias.length > 0 && (
                  <View style={styles.seccion}>
                    <Text style={styles.seccionTitulo}>Evidencia</Text>
                    <View style={styles.evidenciasWrap}>
                      {detalle.evidencias.map((ev) => (
                        <View key={ev.id} style={styles.evidenciaItem}>
                          {(ev.tipo || "").toUpperCase() === "FOTO" && token ? (
                            <Image
                              source={{ uri: ev.url_descarga, headers: { Authorization: `Bearer ${token}` } }}
                              style={styles.evidenciaFoto}
                            />
                          ) : (
                            <View style={styles.evidenciaOtro}>
                              <Icon name="document-outline" size={24} color={COLORS.gray} />
                              <Text style={styles.evidenciaOtroTexto}>{ev.tipo_display || ev.tipo}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Timeline */}
                {Array.isArray(detalle.eventos) && detalle.eventos.length > 0 && (
                  <View style={styles.seccion}>
                    <Text style={styles.seccionTitulo}>Seguimiento</Text>
                    {detalle.eventos.map((ev, i) => {
                      const ultimo = i === detalle.eventos.length - 1;
                      return (
                        <View key={ev.id} style={styles.eventoRow}>
                          <View style={styles.eventoLineaCol}>
                            <View style={styles.eventoDot} />
                            {!ultimo && <View style={styles.eventoLinea} />}
                          </View>
                          <View style={styles.eventoContenido}>
                            <Text style={styles.eventoTitulo}>{ev.tipo_evento_display || ev.tipo_evento}</Text>
                            {!!ev.estado_nuevo && (
                              <Text style={styles.eventoEstado}>
                                {ev.estado_anterior ? `${ev.estado_anterior} → ` : ""}{ev.estado_nuevo}
                              </Text>
                            )}
                            {!!ev.comentario && <Text style={styles.eventoComentario}>{ev.comentario}</Text>}
                            <Text style={styles.eventoFecha}>{fmtFecha(ev.fecha)}{ev.usuario ? ` · ${ev.usuario}` : ""}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <BottomNav selectedTab={selectedTab} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SIZES.padding, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.fontSizeTitle, fontFamily: "Roboto-Bold", fontWeight: "bold", color: COLORS.black },
  list: { padding: SIZES.padding, paddingBottom: 120 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 80 },
  loadingText: { marginTop: 12, fontSize: SIZES.fontSizeBody, color: COLORS.gray },
  emptyText: { marginTop: 12, fontSize: SIZES.fontSizeBody, color: COLORS.gray, textAlign: "center" },
  item: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.white, padding: 14, borderRadius: SIZES.borderRadius,
    marginBottom: 10, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  itemTitulo: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Medium", fontWeight: "bold", color: COLORS.black },
  itemCategoria: { fontSize: SIZES.fontSizeSmall, color: COLORS.primary, marginTop: 2 },
  itemFecha: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  estadoTexto: { fontSize: 11, fontFamily: "Roboto-Medium", fontWeight: "600", textTransform: "capitalize" },
  fab: {
    position: "absolute", right: 20, bottom: 90,
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    justifyContent: "center", alignItems: "center",
    shadowColor: COLORS.black, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: COLORS.white, padding: 20,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, width: "100%",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  modalTitle: { fontSize: SIZES.fontSizeSubtitle, fontFamily: "Roboto-Bold", fontWeight: "bold", color: COLORS.black },
  fieldLabel: { fontSize: SIZES.fontSizeSmall, fontFamily: "Roboto-Medium", fontWeight: "600", color: COLORS.gray, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: SIZES.fontSizeBody, color: COLORS.black, borderWidth: 1, borderColor: COLORS.border,
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  inputError: { borderColor: COLORS.error, borderWidth: 1.5 },
  categoriaWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoriaChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  categoriaChipActivo: { backgroundColor: COLORS.primary },
  categoriaTexto: { fontSize: SIZES.fontSizeSmall, color: COLORS.primary, fontFamily: "Roboto-Medium", fontWeight: "600" },
  categoriaTextoActivo: { color: COLORS.white },
  fotosWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  fotoThumbWrap: { position: "relative" },
  fotoThumb: { width: 70, height: 70, borderRadius: 10 },
  fotoQuitar: { position: "absolute", top: -6, right: -6, backgroundColor: COLORS.white, borderRadius: 10 },
  fotoAgregar: {
    width: 70, height: 70, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary, borderStyle: "dashed",
    justifyContent: "center", alignItems: "center",
  },
  fotoAgregarTexto: { fontSize: 10, color: COLORS.primary, marginTop: 2 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 15, alignItems: "center", marginTop: 16 },
  submitBtnText: { color: COLORS.white, fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", fontWeight: "bold" },
  detalleTitulo: { fontSize: SIZES.fontSizeSubtitle, fontFamily: "Roboto-Bold", fontWeight: "bold", color: COLORS.black, marginBottom: 8 },
  detalleMeta: { fontSize: SIZES.fontSizeSmall, color: COLORS.gray, marginTop: 8 },
  detalleDescripcion: { fontSize: SIZES.fontSizeBody, color: COLORS.black, lineHeight: 20, marginTop: 10 },
  seccion: { marginTop: 20 },
  seccionTitulo: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", fontWeight: "bold", color: COLORS.black, marginBottom: 10 },
  evidenciasWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  evidenciaItem: {},
  evidenciaFoto: { width: 100, height: 100, borderRadius: 10, backgroundColor: COLORS.background },
  evidenciaOtro: { width: 100, height: 100, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  evidenciaOtroTexto: { fontSize: 10, color: COLORS.gray, marginTop: 4 },
  eventoRow: { flexDirection: "row", gap: 12 },
  eventoLineaCol: { alignItems: "center", width: 16 },
  eventoDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, marginTop: 3 },
  eventoLinea: { width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 2 },
  eventoContenido: { flex: 1, paddingBottom: 18 },
  eventoTitulo: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Medium", fontWeight: "600", color: COLORS.black },
  eventoEstado: { fontSize: SIZES.fontSizeSmall, color: COLORS.primary, marginTop: 2 },
  eventoComentario: { fontSize: SIZES.fontSizeSmall, color: COLORS.black, marginTop: 2 },
  eventoFecha: { fontSize: 11, color: COLORS.gray, marginTop: 3 },
});
