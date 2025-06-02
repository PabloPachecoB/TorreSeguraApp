// screens/InvitationScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Share,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import QRCode from "react-native-qrcode-svg";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";

export default function InvitationScreen({ navigation }) {
  const { user } = useUserContext();
  const { selectedTab } = useNavigationContext();
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [purpose, setPurpose] = useState("");
  const [departmentNumber, setDepartmentNumber] = useState("");
  const [whoAuthorizes, setWhoAuthorizes] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [visitorData, setVisitorData] = useState(null);
  const qrRef = useRef(); // Referencia al componente QRCode

  // Validar que el usuario sea propietario
  useEffect(() => {
    if (user?.role !== "Residente") {
      Alert.alert("Acceso denegado", "Esta funcionalidad es solo para propietarios.");
      navigation.replace("Home");
    }
  }, [user, navigation]);

  // Enviar datos al backend y generar QR
  const handleSubmit = async () => {
    if (!name || !document || !purpose || !departmentNumber || !whoAuthorizes) {
      Alert.alert("Error", "Por favor, completa todos los campos obligatorios.");
      return;
    }

    const data = {
      name,
      document,
      purpose,
      departmentNumber,
      whoAuthorizes,
      status: "pending",
    };

    try {
      // Enviar datos al backend (simulado, reemplaza con tu API real)
      const response = await fetch("https://tu-backend/api/visitantes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${user.token}`, // Descomenta y usa el token real cuando integres
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al enviar datos al backend");
      }

      console.log("Datos del visitante antes de generar QR:", data);
      console.log("JSON.stringify(data):", JSON.stringify(data));
      setVisitorData(data);
      setShowForm(false);
      Alert.alert("Éxito", "Invitación registrada correctamente.");
    } catch (error) {
      console.error("Error al procesar invitación:", error);
      console.log("Datos del visitante antes de generar QR (simulado):", data);
      console.log("JSON.stringify(data) (simulado):", JSON.stringify(data));
      setVisitorData(data);
      setShowForm(false);
      Alert.alert("Éxito", "Invitación registrada correctamente (simulado).");
    }
  };

  // Compartir el código QR
  const handleShareQR = async () => {
    if (!qrRef.current) {
      Alert.alert("Error", "No se pudo generar la imagen del QR para compartir.");
      return;
    }

    try {
      // Convertir el QR a una imagen base64
      qrRef.current.toDataURL(async (data) => {
        const base64Image = `data:image/png;base64,${data}`;
        const shareOptions = {
          title: "Código QR de Invitación",
          message: `Código QR para la visita de ${visitorData.name}`,
          url: base64Image,
        };

        await Share.share(shareOptions);
      });
    } catch (error) {
      console.error("Error al compartir el QR:", error);
      Alert.alert("Error", "No se pudo compartir el código QR. Intenta de nuevo.");
    }
  };

  const handleCloseQR = () => {
    setVisitorData(null);
    setShowForm(true);
    setName("");
    setDocument("");
    setPurpose("");
    setDepartmentNumber("");
    setWhoAuthorizes("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Invitación</Text>
        <View style={{ width: 30 }} />
      </View>
      {showForm ? (
        <View style={styles.form}>
          <TextInput
            placeholder="Nombre"
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Carnet de identidad"
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={document}
            onChangeText={setDocument}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Motivo de la visita"
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={purpose}
            onChangeText={setPurpose}
          />
          <TextInput
            placeholder="Número del departamento"
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={departmentNumber}
            onChangeText={setDepartmentNumber}
          />
          <TextInput
            placeholder="Quién lo autoriza"
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={whoAuthorizes}
            onChangeText={setWhoAuthorizes}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Guardar y Generar QR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        visitorData ? (
          <View style={styles.qrModal}>
            <View style={styles.qrContainer}>
              <Text style={styles.qrTitle}>Código QR para {visitorData.name}</Text>
              <QRCode
                value={JSON.stringify(visitorData)}
                size={250}
                backgroundColor={COLORS.white}
                color={COLORS.black}
                getRef={(ref) => (qrRef.current = ref)} // Obtener referencia del QRCode
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.shareButton} onPress={handleShareQR}>
                  <Text style={styles.shareButtonText}>Compartir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseQR}>
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.message}>Error: No se encontraron datos para generar el QR.</Text>
        )
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
  form: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.margin,
    borderRadius: SIZES.borderRadius,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginVertical: SIZES.margin,
  },
  input: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    color: COLORS.black,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  qrModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  qrContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  qrTitle: {
    fontSize: SIZES.fontSizeTitle,
    fontFamily: "Roboto-Bold",
    color: COLORS.black,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "80%",
  },
  shareButton: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 10,
  },
  shareButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    fontWeight: "bold",
  },
  message: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 50,
  },
});