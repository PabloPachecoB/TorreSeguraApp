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
import { API_BASE } from "@env";

export default function QRCodeScreen({ navigation }) {
  const { user, token } = useUserContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [visitorData, setVisitorData] = useState(null);
  const [isValidQR, setIsValidQR] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const isProcessingRef = useRef(false);

  const verifyQRWithBackend = async (qrData) => {
    try {
      console.log("Token usado:", token);
      console.log("API_BASE:", API_BASE);
      
      const response = await fetch(`${API_BASE}/accesos/api/visitas/verificar_qr/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: qrData.id, firma: qrData.firma }),
      });

      const data = await response.json();
      console.log("Status de respuesta:", response.status);
      console.log("Respuesta del backend:", data);

      // Verificar si el token es inválido
      if (response.status === 401 || data.code === "token_not_valid") {
        Alert.alert(
          "Sesión expirada", 
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          [
            {
              text: "OK",
              onPress: () => {
                // Aquí puedes redirigir al login o limpiar el contexto
                navigation.navigate('Login'); // Ajusta según tu navegación
              }
            }
          ]
        );
        setVisitorData(null);
        setIsValidQR(false);
        isProcessingRef.current = false;
        return;
      }

      if (!response.ok || !data.valido) {
        console.log("QR inválido:", data.mensaje);
        setVisitorData(null);
        setIsValidQR(false);
        isProcessingRef.current = false;
        return;
      }

      // QR válido, guardar todos los datos
      const completeVisitorData = {
        id: qrData.id,
        firma: qrData.firma,
        visitante: data.visitante,
        documento: data.documento,
        vivienda: data.vivienda,
        fecha: data.fecha,
        motivo: data.motivo,
        autorizado_por: data.autorizado_por,
        status: "Verificado"
      };

      setVisitorData(completeVisitorData);
      setIsValidQR(true);
      isProcessingRef.current = false;
      
      console.log("Datos completos del visitante:", completeVisitorData);
    } catch (error) {
      console.error("Error al verificar QR:", error);
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor.");
      setVisitorData(null);
      setIsValidQR(false);
      isProcessingRef.current = false;
    }
  };

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

  const handleRegisterEntry = async () => {
    try {
      saveNotification(`Visitante ${visitorData.visitante} verificado.`);
      Alert.alert("Éxito", `Entrada registrada para ${visitorData.visitante}`);
      
      // Actualizar el status
      setVisitorData(prev => ({
        ...prev,
        status: "Entrada Registrada"
      }));
    } catch (error) {
      console.error("Error al registrar entrada:", error);
      Alert.alert("Error", "No se pudo registrar la entrada.");
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (isProcessingRef.current || scanned) return;
    isProcessingRef.current = true;
    console.log("Código QR escaneado:", { type, data });
    setScanned(true);
    try {
      const parsedData = JSON.parse(data);
      console.log("Datos parseados:", parsedData);
      if (parsedData.id && parsedData.firma) {
        // Inmediatamente verificar el QR con el backend
        verifyQRWithBackend(parsedData);
      } else {
        setVisitorData(null);
        setIsValidQR(false);
        isProcessingRef.current = false;
      }
    } catch (error) {
      // console.error("Error al parsear datos del QR:", error);
      setVisitorData(null);
      setIsValidQR(false);
      isProcessingRef.current = false;
    }
  };

  const toggleTorch = () => {
    setTorchEnabled((prev) => !prev);
  };

  useEffect(() => {
    if (!scanned) {
      isProcessingRef.current = false;
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
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          enableTorch={torchEnabled}
          isActive={!scanned}
        />
        {scanned ? (
          <View style={styles.resultContainer}>
            {visitorData && isValidQR ? (
              <View style={styles.resultInner}>
                <Text style={styles.resultTitle}>Información del Visitante</Text>
                <Text style={styles.resultText}>
                  Nombre: {visitorData.visitante || "No disponible"}
                </Text>
                <Text style={styles.resultText}>
                  Carnet de identidad: {visitorData.documento || "No disponible"}
                </Text>
                <Text style={styles.resultText}>
                  Motivo de la visita: {visitorData.motivo || "No disponible"}
                </Text>
                <Text style={styles.resultText}>
                  Departamento: {visitorData.vivienda || "No disponible"}
                </Text>
                <Text style={styles.resultText}>
                  Autorizado por: {visitorData.autorizado_por || "No disponible"}
                </Text>
                <Text style={styles.resultText}>
                  Fecha: {visitorData.fecha || "No disponible"}
                </Text>
                {visitorData.status && (
                  <Text style={styles.resultText}>Estado: {visitorData.status}</Text>
                )}
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
    maxWidth: "90%",
  },
  resultTitle: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 10,
    textAlign: "center",
  },
  resultText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginBottom: 5,
    textAlign: "left",
    width: "100%",
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
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 20,
  },
  retryButtonText: {
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "bold",
  },
});