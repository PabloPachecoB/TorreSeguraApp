// screens/InvitationScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "@expo/vector-icons/Ionicons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import { ROLES } from "../constants/roles";
import { api, normalizeApiError } from "../services/apiClient";

export default function InvitationScreen({ navigation }) {
  const { user } = useUserContext();
  const { selectedTab } = useNavigationContext();
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [purpose, setPurpose] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [qrBase64, setQrBase64] = useState(null);
  const [visitorName, setVisitorName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== ROLES.RESIDENTE) {
      Alert.alert("Acceso denegado", "Esta funcionalidad es solo para residentes.");
      navigation.replace("Home");
    }
  }, [user, navigation]);

  const handleSubmit = async () => {
    if (!name.trim() || !document.trim()) {
      Alert.alert("Error", "El nombre y documento del visitante son obligatorios.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/accesos/visitas/crear/", {
        nombre_visitante: name.trim(),
        documento_visitante: document.trim(),
        vivienda_destino_id: user?.vivienda_id,
        motivo: purpose.trim() || "Visita",
      });

      setQrBase64(response.data.qr_base64);
      setVisitorName(name.trim());
      setShowForm(false);
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(
        "Error",
        normalized.message || "No se pudo registrar la invitacion. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const getQrFilePath = () => {
    const safeName = visitorName.replace(/[^a-zA-Z0-9]/g, "_");
    return `${FileSystem.cacheDirectory}qr_${safeName}.png`;
  };

  const saveQrToFile = async () => {
    const filePath = getQrFilePath();
    await FileSystem.writeAsStringAsync(filePath, qrBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return filePath;
  };

  const handleShare = async () => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Error", "Compartir no esta disponible en este dispositivo.");
        return;
      }
      const filePath = await saveQrToFile();
      await Sharing.shareAsync(filePath, {
        mimeType: "image/png",
        dialogTitle: `QR de invitacion para ${visitorName}`,
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir el QR.");
    }
  };

  const handleDownload = async () => {
    try {
      const filePath = await saveQrToFile();
      await Sharing.shareAsync(filePath, {
        mimeType: "image/png",
        dialogTitle: "Guardar QR",
        UTI: "public.png",
      });
    } catch (error) {
      console.warn("Error guardando QR:", error);
      Alert.alert("Error", "No se pudo guardar el QR.");
    }
  };

  const handleCloseQR = () => {
    setQrBase64(null);
    setVisitorName("");
    setShowForm(true);
    setName("");
    setDocument("");
    setPurpose("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Invitacion</Text>
        <View style={{ width: 30 }} />
      </View>

      {showForm ? (
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.form}>
            <Text style={styles.formLabel}>Nombre del visitante *</Text>
            <TextInput
              placeholder="Nombre completo"
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.formLabel}>Documento de identidad *</Text>
            <TextInput
              placeholder="Numero de documento"
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={document}
              onChangeText={setDocument}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Motivo de la visita</Text>
            <TextInput
              placeholder="Ej: Visita familiar, entrega, etc."
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={purpose}
              onChangeText={setPurpose}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Generar QR de Invitacion</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : qrBase64 ? (
        <ScrollView contentContainerStyle={styles.qrScrollContainer}>
          <View style={styles.qrContainer}>
            <Icon name="checkmark-circle" size={50} color="#4CAF50" />
            <Text style={styles.qrTitle}>Invitacion para {visitorName}</Text>
            <Text style={styles.qrSubtitle}>
              Muestre este codigo al vigilante en la entrada
            </Text>

            <Image
              source={{ uri: `data:image/png;base64,${qrBase64}` }}
              style={styles.qrImage}
              resizeMode="contain"
            />

            <Text style={styles.qrNote}>
              Este QR es de uso unico y sera verificado por seguridad
            </Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Icon name="share-social-outline" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Compartir</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                <Icon name="download-outline" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.newButton} onPress={handleCloseQR}>
              <Icon name="add-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>  Nueva Invitacion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : null}

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
    fontWeight: "bold",
    color: COLORS.black,
  },
  formContainer: {
    padding: SIZES.padding,
  },
  form: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
    color: COLORS.black,
    fontSize: SIZES.fontSizeBody,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontWeight: "bold",
  },
  qrScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding,
  },
  qrContainer: {
    backgroundColor: COLORS.white,
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    width: "100%",
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 10,
    textAlign: "center",
  },
  qrSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
    marginBottom: 20,
    textAlign: "center",
  },
  qrImage: {
    width: 260,
    height: 260,
    marginVertical: 10,
  },
  qrNote: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  shareButton: {
    backgroundColor: "#25D366",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  downloadButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontWeight: "bold",
  },
});
