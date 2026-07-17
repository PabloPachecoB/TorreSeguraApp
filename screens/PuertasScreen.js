// screens/PuertasScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import MainLayout from "../components/MainLayout";
import CustomAlert from "../components/CustomAlert";
import { COLORS, SIZES } from "../constants";
import { listarPuertas, abrirPuerta } from "../services/puertasService";

const ICON_BY_TIPO = {
  PRINCIPAL: "business-outline",
  EDIFICIO: "home-outline",
  VIVIENDA: "key-outline",
};

export default function PuertasScreen({ navigation }) {
  const [puertas, setPuertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [abriendoId, setAbriendoId] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");

  const cargarPuertas = useCallback(async () => {
    setError(null);
    try {
      const data = await listarPuertas();
      setPuertas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarPuertas();
  }, [cargarPuertas]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    cargarPuertas();
  }, [cargarPuertas]);

  const handleAbrir = useCallback(
    async (puerta) => {
      if (abriendoId) return; // evita doble envío
      setAbriendoId(puerta.id);
      try {
        const res = await abrirPuerta(puerta.id);
        setAlertSuccess(true);
        setAlertMessage(res?.mensaje || `${puerta.nombre} abierta correctamente.`);
      } catch (err) {
        setAlertSuccess(false);
        setAlertMessage(err.message || "No se pudo abrir la puerta.");
      } finally {
        setAbriendoId(null);
        setAlertVisible(true);
      }
    },
    [abriendoId]
  );

  return (
    <MainLayout navigation={navigation}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={26} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Puertas</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {error && <Text style={styles.errorText}>Error: {error}</Text>}

          {!error && puertas.length === 0 && (
            <Text style={styles.emptyText}>No tienes puertas asignadas.</Text>
          )}

          {puertas.map((puerta) => (
            <View key={puerta.id} style={styles.card}>
              <View style={styles.cardInfo}>
                <Icon
                  name={ICON_BY_TIPO[puerta.tipo] || "lock-closed-outline"}
                  size={30}
                  color={COLORS.primary}
                  style={styles.cardIcon}
                />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{puerta.nombre}</Text>
                  <Text style={styles.cardSubtitle}>
                    {puerta.tipo_display}
                    {puerta.vivienda ? ` · ${puerta.vivienda}` : puerta.edificio ? ` · ${puerta.edificio}` : ""}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.openButton, abriendoId === puerta.id && styles.openButtonDisabled]}
                onPress={() => handleAbrir(puerta)}
                disabled={abriendoId !== null}
              >
                {abriendoId === puerta.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="lock-open-outline" size={18} color="#fff" />
                    <Text style={styles.openButtonText}>Abrir</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <CustomAlert
        visible={alertVisible}
        success={alertSuccess}
        title={alertSuccess ? "¡Éxito!" : "No se pudo abrir"}
        message={alertMessage}
        primaryButtonText="Aceptar"
        onPrimaryPress={() => setAlertVisible(false)}
      />
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: Math.min(SIZES.fontSizeTitle, 20),
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.black,
  },
  loader: {
    marginTop: 50,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 120,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.black,
  },
  cardSubtitle: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginTop: 2,
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 90,
    justifyContent: "center",
  },
  openButtonDisabled: {
    opacity: 0.6,
  },
  openButtonText: {
    color: "#fff",
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    marginLeft: 6,
  },
  errorText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Regular",
    color: COLORS.error,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
  },
});
