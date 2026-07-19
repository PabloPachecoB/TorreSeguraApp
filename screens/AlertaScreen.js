// screens/AlertScreen.js
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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "@expo/vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { COLORS, SIZES } from "../constants";
import { crearAlerta } from "../services/alertasService";

const alertTypes = [
  { id: "1", title: "Incendio", icon: "flame-outline", color: COLORS.error },
  { id: "2", title: "Sismo", icon: "earth-outline", color: COLORS.gray },
  { id: "3", title: "Seguridad", icon: "shield-checkmark-outline", color: COLORS.error },
  { id: "4", title: "Salud", icon: "heart-outline", color: COLORS.primary },
  { id: "5", title: "Aviso importante", icon: "megaphone-outline", color: COLORS.secondary },
  { id: "6", title: "Reunión", icon: "people-outline", color: COLORS.error },
];

export default function AlertScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  const handleAlertPress = (alert) => {
    setSelectedAlert(alert);
    setModalVisible(true);
  };

  const handleSendAlert = async () => {
    if (sending) return;
    if (!description.trim()) {
      Alert.alert("Error", "Por favor, describe el problema antes de enviar la alerta.");
      return;
    }

    setSending(true);
    try {
      await crearAlerta({
        tipo: selectedAlert.title,
        descripcion: description,
      });

      Alert.alert("Éxito", "Alerta enviada correctamente.");
      setModalVisible(false);
      setDescription("");
      setSelectedAlert(null);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo enviar la alerta.");
    } finally {
      setSending(false);
    }
  };

  const handleCloseModal = () => {
    if (sending) return;
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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              ¿Seguro que quieres reportar "{selectedAlert?.title}"?
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Describe el problema"
              placeholderTextColor={COLORS.gray}
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!sending}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.alertButton, sending && styles.buttonDisabled]}
                onPress={handleSendAlert}
                disabled={sending}
              >
                <Text style={styles.alertButtonText}>
                  {sending ? "Enviando..." : "Alertar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.backButton, sending && styles.buttonDisabled]}
                onPress={handleCloseModal}
                disabled={sending}
              >
                <Text style={styles.backButtonText}>Atrás</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <BottomNav navigation={navigation} />
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
  buttonDisabled: {
    opacity: 0.6,
  },
});