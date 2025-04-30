import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  Image,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext"; // Added to get user
import { COLORS, SIZES } from "../constants";

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
  const { user } = useUserContext(); // Get logged-in user
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [description, setDescription] = useState("");

  // Guardar una notificación en AsyncStorage
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

    const alertDetails = {
      type: selectedAlert.title,
      description,
      username: user?.username || "Usuario desconocido",
    };

    // Log alert details to terminal
    console.log("Alerta enviada:", {
      tipo: alertDetails.type,
      descripción: alertDetails.description,
      enviado_por: alertDetails.username,
      fecha: new Date().toISOString(),
    });

    try {
      // Enviar solicitud al backend para registrar la alerta
      const response = await fetch("https://tu-backend/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${user?.token}`, // Descomenta cuando integres el token
        },
        body: JSON.stringify({
          type: selectedAlert.title,
          description,
          username: user?.username,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      saveNotification(`Alerta enviada: ${selectedAlert.title} - ${description}`);
      Alert.alert("Éxito", "Alerta enviada correctamente.");
      setModalVisible(false);
      setDescription("");
      setSelectedAlert(null);
    } catch (error) {
      console.error("Error al enviar alerta:", error.message);
      saveNotification(`Alerta enviada (simulada): ${selectedAlert.title} - ${description}`);
      Alert.alert("Éxito", "Alerta enviada correctamente (simulada).");
      setModalVisible(false);
      setDescription("");
      setSelectedAlert(null);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setDescription("");
    setSelectedAlert(null);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alertas</Text>
        <View style={{ width: 30 }} />
      </View>
      <FlatList
        data={alertTypes}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.alertList}
      />
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
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.alertButton} onPress={handleSendAlert}>
                <Text style={styles.alertButtonText}>Alertar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backButton} onPress={handleCloseModal}>
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
});