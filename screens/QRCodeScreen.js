// screens/QRCodeScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import { COLORS, SIZES } from "../constants";

export default function QRCodeScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [visitorData, setVisitorData] = useState(null);

  // Manejar el escaneo del código QR
  const handleBarCodeScanned = ({ type, data }) => {
    console.log("Código QR escaneado:", type, data);
    setScanned(true);
    try {
      const parsedData = JSON.parse(data);
      setVisitorData(parsedData);
    } catch (error) {
      Alert.alert("Error", "No se pudo leer el código QR. Asegúrate de que sea válido.");
      setScanned(false);
    }
  };

  if (!permission) {
    // Los permisos de la cámara aún se están cargando
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Solicitando permiso para usar la cámara...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    // Los permisos de la cámara no se han otorgado
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
        {!scanned ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={handleBarCodeScanned}
              enableTorch={false}
              isActive={true}
            />
            <View style={styles.overlay}>
              <View style={styles.overlayInner}>
                <Text style={styles.overlayText}>Escanea el código QR</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            {visitorData ? (
              <>
                <Text style={styles.resultTitle}>Información del Visitante</Text>
                <Text style={styles.resultText}>Nombre: {visitorData.name}</Text>
                <Text style={styles.resultText}>Documento: {visitorData.document}</Text>
                <Text style={styles.resultText}>Fecha: {visitorData.date}</Text>
                <Text style={styles.resultText}>Propósito: {visitorData.purpose}</Text>
              </>
            ) : (
              <Text style={styles.message}>Error al leer el código QR</Text>
            )}
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainText}>Escanear de nuevo</Text>
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
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.white,
    textAlign: "center",
  },
  resultContainer: {
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
  message: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  scanAgainButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  scanAgainText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
});