import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import { obtenerHistorialAccesos } from "../services/accesosService";

const STATUS_LABELS = {
  pending: { text: "Pendiente", color: "#FF9500" },
  scanned: { text: "En sitio", color: "#007BFF" },
  departed: { text: "Salió", color: COLORS.success },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

export default function VisitRequestScreen({ navigation }) {
  const { token } = useUserContext();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

  const cargarHistorial = useCallback(async (searchTerm = "") => {
    try {
      const data = await obtenerHistorialAccesos(searchTerm);
      setHistorial(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn("Error cargando historial:", error.message);
      setHistorial([]);
    }
  }, []);

  useEffect(() => {
    const inicial = async () => {
      setLoading(true);
      await cargarHistorial();
      setLoading(false);
    };
    if (token) inicial();
  }, [token, cargarHistorial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarHistorial(search);
    setRefreshing(false);
  }, [cargarHistorial, search]);

  const handleSearch = (text) => {
    setSearch(text);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      cargarHistorial(text.trim());
    }, 400);
    setSearchTimeout(timeout);
  };

  const renderItem = ({ item }) => {
    const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.pending;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardNameRow}>
            <Icon name="person-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardName}>{item.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Icon name="card-outline" size={14} color={COLORS.gray} />
            <Text style={styles.cardLabel}>Doc:</Text>
            <Text style={styles.cardValue}>{item.document}</Text>
          </View>

          {item.purpose ? (
            <View style={styles.cardRow}>
              <Icon name="chatbubble-outline" size={14} color={COLORS.gray} />
              <Text style={styles.cardLabel}>Motivo:</Text>
              <Text style={styles.cardValue}>{item.purpose}</Text>
            </View>
          ) : null}

          {item.departmentNumber ? (
            <View style={styles.cardRow}>
              <Icon name="home-outline" size={14} color={COLORS.gray} />
              <Text style={styles.cardLabel}>Depto:</Text>
              <Text style={styles.cardValue}>{item.departmentNumber}</Text>
            </View>
          ) : null}

          <View style={styles.cardRow}>
            <Icon name="log-in-outline" size={14} color={COLORS.gray} />
            <Text style={styles.cardLabel}>Entrada:</Text>
            <Text style={styles.cardValue}>{formatDate(item.entryDate)}</Text>
          </View>

          {item.exitDate ? (
            <View style={styles.cardRow}>
              <Icon name="log-out-outline" size={14} color={COLORS.gray} />
              <Text style={styles.cardLabel}>Salida:</Text>
              <Text style={styles.cardValue}>{formatDate(item.exitDate)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={28} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Accesos</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color={COLORS.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Buscar por nombre o documento..."
          placeholderTextColor={COLORS.gray}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Icon name="close-circle" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.periodLabel}>Mostrando registros del último mes</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Icon name="document-text-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No se encontraron registros</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.fontSizeTitle,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.black,
  },
  headerSpacer: {
    width: 28,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SIZES.padding,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.fontSizeBody,
    color: COLORS.black,
    paddingVertical: 2,
  },
  periodLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
    fontFamily: "Roboto-Regular",
  },
  listContent: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  cardName: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.black,
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: "Roboto-Medium",
    fontWeight: "600",
  },
  cardBody: {
    gap: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 6,
    fontFamily: "Roboto-Regular",
  },
  cardValue: {
    fontSize: 13,
    color: COLORS.black,
    marginLeft: 4,
    fontFamily: "Roboto-Regular",
    flexShrink: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: SIZES.fontSizeBody,
    color: COLORS.gray,
    fontFamily: "Roboto-Regular",
  },
  emptyText: {
    marginTop: 12,
    fontSize: SIZES.fontSizeBody,
    color: COLORS.gray,
    fontFamily: "Roboto-Regular",
  },
});
