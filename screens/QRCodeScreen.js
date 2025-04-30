// screens/QRCodeScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import { COLORS, SIZES } from "../constants";
import { useUserContext } from "../context/UserContext";

export default function QRCodeScreen({ navigation }) {
  const { user } = useUserContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [visitorData, setVisitorData] = useState(null);
  const [isValidQR, setIsValidQR] = useState(true); // Nuevo estado para validar el QR
  const [torchEnabled, setTorchEnabled] = useState(false);
  const isProcessingRef = useRef(false); // Referencia para evitar múltiples escaneos

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

  // Registrar la entrada del visitante
  const handleRegisterEntry = async () => {
    try {
      // Enviar solicitud al backend para registrar la entrada
      const response = await fetch(`https://tu-backend/api/visitantes/register-entry`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${user.token}`, // Descomenta y usa el token real cuando integres
        },
        body: JSON.stringify({ ...visitorData, status: "scanned" }),
      });

      if (!response.ok) {
        throw new Error("Error al registrar la entrada");
      }

      saveNotification(`Visitante ${visitorData.name} ha ingresado.`);
      Alert.alert("Éxito", "Entrada registrada correctamente.");
      setScanned(false);
      setVisitorData(null);
      setIsValidQR(true); // Reinicia la validación
      isProcessingRef.current = false; // Reinicia el estado de procesamiento
    } catch (error) {
      console.error("Error al registrar entrada:", error);
      saveNotification(`Visitante ${visitorData.name} ha ingresado.`);
      Alert.alert("Éxito", "Entrada registrada correctamente (simulado).");
      setScanned(false);
      setVisitorData(null);
      setIsValidQR(true); // Reinicia la validación
      isProcessingRef.current = false; // Reinicia el estado de procesamiento
    }
  };

  // Validar si el QR pertenece a TorreSegura
  const validateQRData = (data) => {
    const requiredFields = ["name", "document", "purpose", "departmentNumber", "whoAuthorizes", "status"];
    return requiredFields.every((field) => field in data);
  };

  // Manejar el escaneo del código QR
  const handleBarCodeScanned = ({ type, data }) => {
    if (isProcessingRef.current || scanned) return; // Evita procesar más escaneos si ya se escaneó un QR
    isProcessingRef.current = true; // Marca que estamos procesando un escaneo
    console.log("Código QR escaneado:", { type, data });
    setScanned(true);
    try {
      const parsedData = JSON.parse(data);
      console.log("Datos parseados:", parsedData);
      if (validateQRData(parsedData)) {
        setVisitorData(parsedData);
        setIsValidQR(true);
      } else {
        setVisitorData(null);
        setIsValidQR(false);
      }
    } catch (error) {
      console.error("Error al parsear datos del QR:", error);
      setVisitorData(null);
      setIsValidQR(false);
    }
  };

  // Alternar el flash
  const toggleTorch = () => {
    setTorchEnabled((prev) => !prev);
  };

  // Reiniciar el estado de procesamiento cuando se cambia el estado de scanned
  useEffect(() => {
    if (!scanned) {
      isProcessingRef.current = false; // Reinicia el estado de procesamiento cuando se permite un nuevo escaneo
    }
  }, [scanned]);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Solicitando permiso para usar la cámara...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Necesitamos tu permiso para usar la cámara.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
          <Text style={styles.retryButtonText}>Otorgar permiso</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear Código QR</Text>
        <View style={{ width: 30 }} />
      </View>
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} // Desactiva el escaneo cuando scanned es true
          enableTorch={torchEnabled}
          isActive={!scanned} // Desactiva el componente cuando scanned es true
        />
        {scanned ? (
          <View style={styles.resultContainer}>
            {visitorData && isValidQR ? (
              <View style={styles.resultInner}>
                <Text style={styles.resultTitle}>Información del Visitante</Text>
                <Text style={styles.resultText}>Nombre: {visitorData.name}</Text>
                <Text style={styles.resultText}>Carnet de identidad: {visitorData.document}</Text>
                <Text style={styles.resultText}>Motivo de la visita: {visitorData.purpose}</Text>
                <Text style={styles.resultText}>Departamento: {visitorData.departmentNumber}</Text>
                <Text style={styles.resultText}>Autorizado por: {visitorData.whoAuthorizes}</Text>
                <Text style={styles.resultText}>Estado: {visitorData.status}</Text>
                <TouchableOpacity style={styles.registerButton} onPress={handleRegisterEntry}>
                  <Text style={styles.registerButtonText}>Registrar Entrada</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scanAgainButton}
                  onPress={() => {
                    setScanned(false);
                    setVisitorData(null);
                    setIsValidQR(true);
                  }}
                >
                  <Text style={styles.scanAgainText}>Escanear de nuevo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Image
                  source={require("../assets/logoSmall.png")}
                  style={styles.errorLogo}
                  resizeMode="contain"
                />
                <Text style={styles.errorMessage}>Este QR no pertenece a TorreSegura</Text>
                <TouchableOpacity
                  style={styles.scanAgainButton}
                  onPress={() => {
                    setScanned(false);
                    setVisitorData(null);
                    setIsValidQR(true);
                  }}
                >
                  <Text style={styles.scanAgainText}>Escanear de nuevo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.overlay}>
            <View style={styles.overlayInner}>
              <Text style={styles.overlayText}>Escanea el código QR</Text>
            </View>
            <TouchableOpacity style={styles.torchButton} onPress={toggleTorch}>
              <Icon
                name={torchEnabled ? "flash" : "flash-off"}
                size={30}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  scannerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  overlayInner: {
    width: 300,
    height: 300,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 60,
  },
  overlayText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.white,
    textAlign: "center",
  },
  torchButton: {
    position: "absolute",
    bottom: 30,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 50,
  },
  resultContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  resultInner: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: "center",
  },
  resultTitle: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 10,
  },
  resultText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginBottom: 5,
  },
  errorContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: "center",
  },
  errorLogo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  scanAgainButton: {
    backgroundColor: COLORS.gray,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  scanAgainText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
});