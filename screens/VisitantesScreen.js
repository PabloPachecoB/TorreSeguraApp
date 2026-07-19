import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Icon from "@expo/vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import { ROLES } from "../constants/roles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, normalizeApiError } from "../services/apiClient";
import { eliminarInvitacion } from "../services/accesosService";

export default function VisitantesScreen({ navigation, route }) {
  const role = route.params?.role || ROLES.VIGILANTE;
  const { selectedTab } = useNavigationContext();
  const { user } = useUserContext();
  const [visitors, setVisitors] = useState([]);
  const [screenMode, setScreenMode] = useState("initial");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadVisitors = useCallback(async () => {
    try {
      const response = await api.get("/visitantes/");
      const raw = response?.data;
      const data = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
      setVisitors(data);
    } catch (error) {
      const normalized = normalizeApiError(error);
      console.error("Error al cargar visitantes:", normalized);
      setVisitors([]);
    }
  }, []);

  useEffect(() => {
    const inicial = async () => {
      setLoading(true);
      await loadVisitors();
      setLoading(false);
    };
    inicial();
  }, [loadVisitors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVisitors();
    setRefreshing(false);
  }, [loadVisitors]);

  const saveNotification = async (message) => {
    try {
      const storedNotifications = await AsyncStorage.getItem("notifications");
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      notifications.push({ message, date: new Date().toISOString() });
      await AsyncStorage.setItem("notifications", JSON.stringify(notifications));
    } catch (error) {
      console.error("Error al guardar notificacion:", error);
    }
  };

  const handleMarkExit = async (visitor) => {
    try {
      await api.patch(`/visitantes/${visitor.id}/mark-exit/`, {
        status: "departed",
      });
      saveNotification(`Visitante ${visitor.name} ha salido.`);
      Alert.alert("Exito", "Salida marcada correctamente.");
      setVisitors((prev) => prev.filter((v) => v.id !== visitor.id));
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert("Error", normalized.message || "No se pudo marcar la salida.");
    }
  };

  const handleDeleteInvitation = (visitor) => {
    Alert.alert(
      "Eliminar invitacion",
      `Estas seguro de eliminar la invitacion de ${visitor.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarInvitacion(visitor.id);
              Alert.alert("Eliminado", "La invitacion fue eliminada.");
              setVisitors((prev) => prev.filter((v) => v.id !== visitor.id));
            } catch (error) {
              Alert.alert("Error", error.message || "No se pudo eliminar la invitacion.");
            }
          },
        },
      ]
    );
  };

  const pendingVisitors = visitors.filter((v) => v.status === "pending");
  const scannedVisitors = visitors.filter((v) => v.status === "scanned");

  const getVisitorStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FF9500";
      case "scanned":
        return COLORS.success;
      default:
        return COLORS.black;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month} ${hours}:${mins}`;
  };

  const renderPendingVisitor = ({ item }) => (
    <View style={[styles.visitorItem, { borderColor: getVisitorStatusColor("pending") }]}>
      <View style={styles.visitorHeader}>
        <Icon name="person-outline" size={24} color={getVisitorStatusColor("pending")} />
        <Text style={styles.visitorText}>{item.name}</Text>
      </View>
      <View style={styles.visitorInfo}>
        <Text style={styles.visitorDetail}>
          <Text style={styles.label}>Documento:</Text> {item.document}
        </Text>
        <Text style={styles.visitorDetail}>
          <Text style={styles.label}>Motivo:</Text> {item.purpose || "—"}
        </Text>
        {item.departmentNumber ? (
          <Text style={styles.visitorDetail}>
            <Text style={styles.label}>Departamento:</Text> {item.departmentNumber}
          </Text>
        ) : null}
        {item.entryDate ? (
          <Text style={styles.visitorDetail}>
            <Text style={styles.label}>Creado:</Text> {formatDate(item.entryDate)}
          </Text>
        ) : null}
        <View style={styles.pendingStatusRow}>
          <Icon name="time-outline" size={14} color="#FF9500" />
          <Text style={styles.pendingStatusText}>QR pendiente de escaneo</Text>
        </View>

        {user?.role === ROLES.RESIDENTE && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteInvitation(item)}
          >
            <Icon name="trash-outline" size={16} color={COLORS.white} />
            <Text style={styles.deleteButtonText}>Eliminar invitacion</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderScannedVisitor = ({ item }) => (
    <View style={[styles.visitorItem, { borderColor: getVisitorStatusColor("scanned") }]}>
      <View style={styles.visitorHeader}>
        <Icon name="person-outline" size={24} color={getVisitorStatusColor("scanned")} />
        <Text style={styles.visitorText}>{item.name}</Text>
      </View>
      <View style={styles.visitorInfo}>
        <Text style={styles.visitorDetail}>
          <Text style={styles.label}>Documento:</Text> {item.document}
        </Text>
        <Text style={styles.visitorDetail}>
          <Text style={styles.label}>Motivo:</Text> {item.purpose || "—"}
        </Text>
        <Text style={styles.visitorDetail}>
          <Text style={styles.label}>Departamento:</Text> {item.departmentNumber}
        </Text>
        <Text style={styles.visitorDetail}>
          <Text style={styles.label}>Autorizado por:</Text> {item.whoAuthorizes}
        </Text>
        <Text style={styles.visitorDetail}>
          <Text style={styles.label}>Estado:</Text> En sitio
        </Text>
        {user?.role !== ROLES.RESIDENTE && (
          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => handleMarkExit(item)}
          >
            <Text style={styles.exitButtonText}>Marcar Salida</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderListContent = () => {
    if (loading) {
      return (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.message}>Cargando...</Text>
        </View>
      );
    }

    const data = screenMode === "pending" ? pendingVisitors : scannedVisitors;
    const emptyMsg =
      screenMode === "pending"
        ? "No hay invitaciones pendientes."
        : "No hay visitantes en sitio.";

    return (
      <FlatList
        data={data}
        renderItem={screenMode === "pending" ? renderPendingVisitor : renderScannedVisitor}
        keyExtractor={(item) => `${screenMode}-${item.id}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.centeredMessage}>
            <Icon name="people-outline" size={48} color={COLORS.gray} />
            <Text style={styles.message}>{emptyMsg}</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (screenMode !== "initial") {
              setScreenMode("initial");
            } else {
              navigation.goBack();
            }
          }}
        >
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {role === "propietario" || user?.role === ROLES.RESIDENTE
            ? "Mis Visitantes"
            : "Visitantes"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {screenMode === "initial" ? (
        <View style={styles.initialContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setScreenMode("pending")}
          >
            <View style={styles.optionRow}>
              <Icon name="time-outline" size={28} color="#FF9500" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionButtonText}>Invitaciones Pendientes</Text>
                <Text style={styles.optionDescription}>QR aun no escaneados</Text>
              </View>
              {pendingVisitors.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingVisitors.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setScreenMode("scanned")}
          >
            <View style={styles.optionRow}>
              <Icon name="checkmark-circle-outline" size={28} color={COLORS.success} />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionButtonText}>Visitantes En Sitio</Text>
                <Text style={styles.optionDescription}>QR escaneados, aun en el edificio</Text>
              </View>
              {scannedVisitors.length > 0 && (
                <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
                  <Text style={styles.badgeText}>{scannedVisitors.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {screenMode === "pending" ? "Invitaciones Pendientes" : "Visitantes En Sitio"}
          </Text>
          {renderListContent()}
        </View>
      )}

      <BottomNav selectedTab={selectedTab} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.fontSizeTitle,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.black,
  },
  initialContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
  },
  optionButton: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    marginVertical: 8,
    width: "90%",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  optionButtonText: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#FF9500",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  section: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginVertical: 10,
  },
  list: {
    paddingBottom: 10,
  },
  visitorItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 4,
  },
  visitorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  visitorText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginLeft: 10,
  },
  visitorInfo: {
    marginLeft: 34,
  },
  visitorDetail: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginBottom: 4,
  },
  label: {
    fontWeight: "bold",
    color: COLORS.black,
  },
  pendingStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  pendingStatusText: {
    fontSize: 12,
    color: "#FF9500",
    fontFamily: "Roboto-Medium",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  exitButton: {
    backgroundColor: COLORS.error,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  exitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  centeredMessage: {
    alignItems: "center",
    marginTop: 60,
  },
  message: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 10,
  },
});
