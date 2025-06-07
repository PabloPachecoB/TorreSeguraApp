import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";

// Servicio para manejar las alertas
// Servicio para manejar las alertas
class AlertasService {
  static BASE_URL = "http://192.168.0.13:8000";

  static async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      console.log("Token retrieved:", token ? "Found" : "Not found");
      console.log("Token type:", typeof token);
      console.log("Token length:", token ? token.length : 0);
      console.log("=============================");
      return token;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  static async getAuthHeaders() {
    const token = await this.getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    };
    
    console.log("Headers being sent:", headers);
    return headers;
  }

  static async crearAlerta(alertaData) {
    try {
      console.log("🚀 Intentando crear alerta...");
      console.log("Datos:", alertaData);
      
      const headers = await this.getAuthHeaders();
      const url = `${this.BASE_URL}/api/api/alertas/crear/`;
      console.log("URL:", url);
      
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(alertaData),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const responseText = await response.text();
        console.log("Error response text:", responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: responseText };
        }
        
        throw new Error(errorData.detail || `Método "${response.status === 405 ? 'POST' : 'HTTP'}" no permitido.`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating alerta:", error);
      throw error;
    }
  }

  static async obtenerMisAlertas() {
    try {
      console.log("📱 Intentando obtener mis alertas...");
      
      const headers = await this.getAuthHeaders();
      const url = `${this.BASE_URL}/api/api/alertas/mis-alertas/`;
      console.log("URL:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const responseText = await response.text();
        console.log("Error response text:", responseText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Mis alertas recibidas:", data.length || 0, "alertas");
      return data;
    } catch (error) {
      console.error("Error fetching mis alertas:", error);
      throw error;
    }
  }

  static async obtenerTodasLasAlertas() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.BASE_URL}/api/api/alertas/`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching todas las alertas:", error);
      throw error;
    }
  }
}
const alertTypes = [
  { id: "1", title: "Incendio", icon: "flame-outline", color: COLORS.error },
  { id: "2", title: "Sismo", icon: "earth-outline", color: COLORS.gray },
  { id: "3", title: "Seguridad", icon: "shield-checkmark-outline", color: COLORS.error },
  { id: "4", title: "Salud", icon: "heart-outline", color: COLORS.primary },
  { id: "5", title: "Aviso importante", icon: "megaphone-outline", color: COLORS.secondary },
  { id: "6", title: "Reunión", icon: "people-outline", color: COLORS.error },
];

export default function AlertScreen({ navigation }) {
  const { selectedTab } = useNavigationContext();
  const { user } = useUserContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertasEnviadas, setAlertasEnviadas] = useState([]);
  const [showMisAlertas, setShowMisAlertas] = useState(false);

  // Cargar alertas del usuario al iniciar
  useEffect(() => {
  // 🔍 Debug temporal para verificar token
  const checkToken = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("🔍 Token actual:", token);
    console.log("🔍 Token existe:", !!token);
    if (token) {
      console.log("🔍 Primeros 20 caracteres:", token.substring(0, 20) + "...");
      console.log("🔍 Últimos 20 caracteres:", "..." + token.substring(token.length - 20));
    }
  };
  
  checkToken();
  cargarMisAlertas();
}, []);
  const cargarMisAlertas = async () => {
    try {
      const alertas = await AlertasService.obtenerMisAlertas();
      setAlertasEnviadas(alertas);
    } catch (error) {
      console.error("Error al cargar mis alertas:", error);
    }
  };

  // Guardar notificación local
  const saveNotification = async (message) => {
    try {
      const storedNotifications = await AsyncStorage.getItem("notifications");
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      const newNotification = {
        message,
        date: new Date().toISOString(),
      };
      notifications.push(newNotification);
      await AsyncStorage.setItem("notifications", JSON.stringify(notifications));
    } catch (error) {
      console.error("Error al guardar notificación:", error);
    }
  };

  const handleAlertPress = (alert) => {
    setSelectedAlert(alert);
    setModalVisible(true);
  };

  const handleSendAlert = async () => {
    if (!description.trim()) {
      Alert.alert("Error", "Por favor, describe el problema antes de enviar la alerta.");
      return;
    }

    setLoading(true);

    const alertaData = {
      tipo: selectedAlert.title,
      descripcion: description,
    };

    try {
      const nuevaAlerta = await AlertasService.crearAlerta(alertaData);
      
      // Guardar notificación local
      await saveNotification(`Alerta enviada: ${selectedAlert.title} - ${description}`);
      
      // Actualizar lista de mis alertas
      await cargarMisAlertas();
      
      Alert.alert("Éxito", "Alerta enviada correctamente.");
      handleCloseModal();
      
    } catch (error) {
      console.error("Error al enviar alerta:", error);
      
      // Modo fallback - guardar como simulada
      await saveNotification(`Alerta enviada (simulada): ${selectedAlert.title} - ${description}`);
      Alert.alert(
        "Error de conexión", 
        "No se pudo conectar al servidor, pero tu alerta ha sido guardada localmente."
      );
      handleCloseModal();
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setDescription("");
    setSelectedAlert(null);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return COLORS.error;
      case 'en_proceso': return COLORS.secondary;
      case 'resuelto': return COLORS.success;
      default: return COLORS.gray;
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En Proceso';
      case 'resuelto': return 'Resuelto';
      default: return estado;
    }
  };

  const renderAlert = ({ item }) => (
    <TouchableOpacity
      style={[styles.alertCard, { borderColor: item.color }]}
      onPress={() => handleAlertPress(item)}
    >
      <Icon name={item.icon} size={40} color={item.color} />
      <Text style={styles.alertTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderMiAlerta = ({ item }) => (
    <View style={styles.alertaHistorial}>
      <View style={styles.alertaHistorialHeader}>
        <Text style={styles.alertaHistorialTipo}>{item.tipo}</Text>
        <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
          <Text style={styles.estadoTexto}>{getEstadoTexto(item.estado)}</Text>
        </View>
      </View>
      <Text style={styles.alertaHistorialDescripcion}>{item.descripcion}</Text>
      <Text style={styles.alertaHistorialFecha}>
        {new Date(item.fecha).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alertas</Text>
        <TouchableOpacity onPress={() => setShowMisAlertas(!showMisAlertas)}>
          <Icon name="list-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* Toggle entre tipos de alerta y mis alertas */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, !showMisAlertas && styles.toggleButtonActive]}
          onPress={() => setShowMisAlertas(false)}
        >
          <Text style={[styles.toggleText, !showMisAlertas && styles.toggleTextActive]}>
            Enviar Alerta
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, showMisAlertas && styles.toggleButtonActive]}
          onPress={() => setShowMisAlertas(true)}
        >
          <Text style={[styles.toggleText, showMisAlertas && styles.toggleTextActive]}>
            Mis Alertas ({alertasEnviadas.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      {showMisAlertas ? (
        <FlatList
          data={alertasEnviadas}
          renderItem={renderMiAlerta}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.alertList}
          refreshing={loading}
          onRefresh={cargarMisAlertas}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No has enviado alertas aún</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={alertTypes}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.alertList}
        />
      )}

      {/* Modal para enviar alerta */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              ¿Seguro quieres enviar una alerta de {selectedAlert?.title.toLowerCase()}?
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Describe el problema"
              placeholderTextColor={COLORS.gray}
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!loading}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.alertButton, loading && styles.buttonDisabled]} 
                onPress={handleSendAlert}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.alertButtonText}>Alertar</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.backButton, loading && styles.buttonDisabled]} 
                onPress={handleCloseModal}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>Atrás</Text>
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    margin: SIZES.padding,
    borderRadius: SIZES.borderRadius,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: SIZES.borderRadius - 4,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: SIZES.fontSizeBody,
    color: COLORS.gray,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  alertList: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  alertCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 2,
  },
  alertTitle: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginTop: 10,
    textAlign: "center",
  },
  alertaHistorial: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  alertaHistorialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertaHistorialTipo: {
    fontSize: SIZES.fontSizeSubtitle,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoTexto: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertaHistorialDescripcion: {
    fontSize: SIZES.fontSizeBody,
    color: COLORS.gray,
    marginBottom: 8,
  },
  alertaHistorialFecha: {
    fontSize: 12,
    color: COLORS.gray,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: SIZES.fontSizeBody,
    color: COLORS.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 8,
    width: "100%",
    height: 100,
    marginBottom: 20,
    color: COLORS.black,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  alertButton: {
    backgroundColor: COLORS.error,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 5,
  },
  alertButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: COLORS.success,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginLeft: 5,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});