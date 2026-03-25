import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "@expo/vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { COLORS, SIZES } from "../constants";
import {
  obtenerCuotasPendientes,
  obtenerCuotasPagadas,
  obtenerMisPagos,
  registrarPago,
} from "../services/pagosService";

const METODOS_PAGO = [
  { id: "TRANSFERENCIA", title: "Transferencia Bancaria", icon: "business-outline", color: COLORS.primary },
  { id: "TARJETA", title: "Tarjeta de Credito/Debito", icon: "card-outline", color: COLORS.secondary },
  { id: "EFECTIVO", title: "Efectivo", icon: "cash-outline", color: COLORS.success },
];

export default function PaymentScreen({ navigation }) {
  const { selectedTab } = useNavigationContext();
  const [activeTab, setActiveTab] = useState("pendientes");
  const [pendientes, setPendientes] = useState([]);
  const [pagadas, setPagadas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de pago
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCuotas, setSelectedCuotas] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [referencia, setReferencia] = useState("");
  const [paying, setPaying] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (activeTab === "pendientes") {
        const data = await obtenerCuotasPendientes();
        setPendientes(Array.isArray(data) ? data : []);
      } else if (activeTab === "pagadas") {
        const data = await obtenerCuotasPagadas();
        setPagadas(Array.isArray(data) ? data : []);
      } else {
        const data = await obtenerMisPagos();
        setPagos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (__DEV__) console.warn("Error cargando datos financieros:", error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleCuotaSelection = (cuota) => {
    setSelectedCuotas((prev) => {
      const exists = prev.find((c) => c.id === cuota.id);
      if (exists) return prev.filter((c) => c.id !== cuota.id);
      return [...prev, cuota];
    });
  };

  const openPayModal = () => {
    if (selectedCuotas.length === 0) {
      Alert.alert("Aviso", "Selecciona al menos una cuota para pagar.");
      return;
    }
    setModalVisible(true);
  };

  const handlePay = async () => {
    if (!selectedMethod) {
      Alert.alert("Error", "Selecciona un metodo de pago.");
      return;
    }
    if (selectedMethod.id === "TRANSFERENCIA" && !referencia.trim()) {
      Alert.alert("Error", "Ingresa el numero de referencia de la transferencia.");
      return;
    }

    setPaying(true);
    try {
      await registrarPago({
        cuotaIds: selectedCuotas.map((c) => c.id),
        metodoPago: selectedMethod.id,
        referencia,
      });

      Alert.alert("Exito", "Pago registrado. Queda pendiente de verificacion por el gerente.");
      setModalVisible(false);
      setSelectedCuotas([]);
      setSelectedMethod(null);
      setReferencia("");
      // Refrescar pendientes
      setLoading(true);
      loadData();
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.message ||
        "No se pudo registrar el pago.";
      Alert.alert("Error", msg);
    } finally {
      setPaying(false);
    }
  };

  const totalSeleccionado = selectedCuotas.reduce(
    (sum, c) => sum + parseFloat(c.total || c.monto || 0),
    0
  );

  // --- Render helpers ---

  const renderCuotaPendiente = ({ item }) => {
    const isSelected = selectedCuotas.some((c) => c.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => toggleCuotaSelection(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardRow}>
          <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
            {isSelected && <Icon name="checkmark" size={16} color="#FFF" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.concepto_nombre}</Text>
            <Text style={styles.cardSub}>{item.vivienda_nombre}</Text>
            <View style={styles.cardInfoRow}>
              <Text style={styles.cardLabel}>Vence:</Text>
              <Text style={[styles.cardValue, item.vencida && { color: COLORS.error }]}>
                {item.fecha_vencimiento}
              </Text>
            </View>
            {parseFloat(item.recargo) > 0 && (
              <View style={styles.cardInfoRow}>
                <Text style={styles.cardLabel}>Recargo:</Text>
                <Text style={[styles.cardValue, { color: COLORS.error }]}>
                  {parseFloat(item.recargo).toFixed(2)} BOB
                </Text>
              </View>
            )}
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>{parseFloat(item.total).toFixed(2)}</Text>
            <Text style={styles.amountCurrency}>BOB</Text>
            {item.vencida && (
              <View style={[styles.badge, { backgroundColor: COLORS.error }]}>
                <Text style={styles.badgeText}>Vencida</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCuotaPagada = ({ item }) => (
    <View style={[styles.card, { borderLeftColor: COLORS.success }]}>
      <View style={styles.cardRow}>
        <Icon name="checkmark-circle" size={28} color={COLORS.success} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.concepto_nombre}</Text>
          <Text style={styles.cardSub}>{item.vivienda_nombre}</Text>
          <View style={styles.cardInfoRow}>
            <Text style={styles.cardLabel}>Vencimiento:</Text>
            <Text style={styles.cardValue}>{item.fecha_vencimiento}</Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, { color: COLORS.success }]}>
            {parseFloat(item.monto).toFixed(2)}
          </Text>
          <Text style={styles.amountCurrency}>BOB</Text>
        </View>
      </View>
    </View>
  );

  const renderPago = ({ item }) => {
    const estadoColor =
      item.estado === "VERIFICADO"
        ? COLORS.success
        : item.estado === "RECHAZADO"
        ? COLORS.error
        : "#F59E0B";
    return (
      <View style={[styles.card, { borderLeftColor: estadoColor }]}>
        <View style={styles.cardRow}>
          <Icon
            name={
              item.estado === "VERIFICADO"
                ? "checkmark-circle"
                : item.estado === "RECHAZADO"
                ? "close-circle"
                : "time"
            }
            size={28}
            color={estadoColor}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.metodo_display}</Text>
            <Text style={styles.cardSub}>{item.fecha_pago}</Text>
            {item.referencia ? (
              <Text style={styles.cardSub}>Ref: {item.referencia}</Text>
            ) : null}
            {item.cuotas_detalle?.map((cd) => (
              <Text key={cd.id} style={styles.cardSub}>
                - {cd.cuota_descripcion} ({parseFloat(cd.monto_aplicado).toFixed(2)} BOB)
              </Text>
            ))}
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amountText, { color: estadoColor }]}>
              {parseFloat(item.monto).toFixed(2)}
            </Text>
            <Text style={styles.amountCurrency}>BOB</Text>
            <View style={[styles.badge, { backgroundColor: estadoColor }]}>
              <Text style={styles.badgeText}>{item.estado_display}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const getListData = () => {
    if (activeTab === "pendientes") return pendientes;
    if (activeTab === "pagadas") return pagadas;
    return pagos;
  };

  const getRenderItem = () => {
    if (activeTab === "pendientes") return renderCuotaPendiente;
    if (activeTab === "pagadas") return renderCuotaPagada;
    return renderPago;
  };

  const getEmptyText = () => {
    if (activeTab === "pendientes") return "No tienes cuotas pendientes.";
    if (activeTab === "pagadas") return "No hay cuotas pagadas aun.";
    return "No hay pagos registrados.";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={28} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagos</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: "pendientes", label: "Pendientes", icon: "alert-circle-outline" },
          { key: "pagadas", label: "Pagadas", icon: "checkmark-done-outline" },
          { key: "historial", label: "Historial", icon: "receipt-outline" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab.key);
              setSelectedCuotas([]);
            }}
          >
            <Icon
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? COLORS.primary : COLORS.gray}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.key === "pendientes" && pendientes.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendientes.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={getListData()}
          renderItem={getRenderItem()}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Icon name="wallet-outline" size={60} color={COLORS.gray} />
              <Text style={styles.emptyText}>{getEmptyText()}</Text>
            </View>
          }
        />
      )}

      {/* Floating pay button */}
      {activeTab === "pendientes" && selectedCuotas.length > 0 && (
        <View style={styles.floatingBar}>
          <View>
            <Text style={styles.floatingLabel}>
              {selectedCuotas.length} cuota{selectedCuotas.length > 1 ? "s" : ""} seleccionada{selectedCuotas.length > 1 ? "s" : ""}
            </Text>
            <Text style={styles.floatingTotal}>Total: {totalSeleccionado.toFixed(2)} BOB</Text>
          </View>
          <TouchableOpacity style={styles.payFab} onPress={openPayModal}>
            <Icon name="wallet" size={20} color="#FFF" />
            <Text style={styles.payFabText}>Pagar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmar Pago</Text>

            <View style={styles.modalSummary}>
              <Text style={styles.modalSummaryLabel}>Cuotas seleccionadas:</Text>
              {selectedCuotas.map((c) => (
                <Text key={c.id} style={styles.modalSummaryItem}>
                  - {c.concepto_nombre}: {parseFloat(c.total).toFixed(2)} BOB
                </Text>
              ))}
              <View style={styles.modalDivider} />
              <Text style={styles.modalTotalText}>
                Total: {totalSeleccionado.toFixed(2)} BOB
              </Text>
            </View>

            <Text style={styles.modalSubtitle}>Metodo de pago:</Text>
            {METODOS_PAGO.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodItem,
                  selectedMethod?.id === method.id && { borderColor: method.color, borderWidth: 2 },
                ]}
                onPress={() => setSelectedMethod(method)}
              >
                <Icon name={method.icon} size={22} color={method.color} />
                <Text style={styles.methodText}>{method.title}</Text>
                {selectedMethod?.id === method.id && (
                  <Icon name="checkmark-circle" size={20} color={method.color} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            ))}

            {selectedMethod?.id === "TRANSFERENCIA" && (
              <TextInput
                style={styles.modalInput}
                placeholder="Numero de referencia / transaccion"
                placeholderTextColor={COLORS.gray}
                value={referencia}
                onChangeText={setReferencia}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.primary }]}
                onPress={handlePay}
                disabled={paying}
              >
                {paying ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnText}>Confirmar Pago</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.gray }]}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedMethod(null);
                  setReferencia("");
                }}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
  },
  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.gray },
  tabTextActive: { color: COLORS.primary, fontWeight: "600" },
  tabBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "bold" },
  // List
  list: { padding: 16, paddingBottom: 140 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  loadingText: { marginTop: 10, color: COLORS.gray, fontSize: 14 },
  emptyText: { marginTop: 12, color: COLORS.gray, fontSize: 15, textAlign: "center" },
  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderLeftColor: COLORS.secondary,
    backgroundColor: "#EBF5FF",
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: COLORS.black },
  cardSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  cardInfoRow: { flexDirection: "row", marginTop: 3 },
  cardLabel: { fontSize: 12, color: COLORS.gray, marginRight: 4 },
  cardValue: { fontSize: 12, fontWeight: "500", color: COLORS.black },
  amountContainer: { alignItems: "flex-end", marginLeft: 8 },
  amountText: { fontSize: 18, fontWeight: "bold", color: COLORS.primary },
  amountCurrency: { fontSize: 11, color: COLORS.gray },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  // Floating bar
  floatingBar: {
    position: "absolute",
    bottom: 70,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingLabel: { fontSize: 13, color: COLORS.gray },
  floatingTotal: { fontSize: 16, fontWeight: "bold", color: COLORS.primary },
  payFab: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  payFabText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.black, marginBottom: 16 },
  modalSubtitle: { fontSize: 15, fontWeight: "600", color: COLORS.black, marginBottom: 10, marginTop: 8 },
  modalSummary: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  modalSummaryLabel: { fontSize: 13, fontWeight: "600", color: COLORS.gray, marginBottom: 6 },
  modalSummaryItem: { fontSize: 13, color: COLORS.black, marginBottom: 2 },
  modalDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  modalTotalText: { fontSize: 16, fontWeight: "bold", color: COLORS.primary },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  methodText: { fontSize: 14, color: COLORS.black },
  modalInput: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    color: COLORS.black,
    marginTop: 8,
  },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
});
