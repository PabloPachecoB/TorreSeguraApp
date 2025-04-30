import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const mockVisitors = [
  {
    id: "1",
    name: "Ana Martínez",
    document: "98765432",
    purpose: "Visita familiar",
    departmentNumber: "101",
    whoAuthorizes: "Juan Pérez",
    status: "pending",
  },
  {
    id: "2",
    name: "Luis Rodríguez",
    document: "45678912",
    purpose: "Entrega",
    departmentNumber: "102",
    whoAuthorizes: "María Gómez",
    status: "scanned",
  },
];

export default function VisitantesScreen({ navigation, route }) {
  const role = route.params?.role || "portero";
  const { selectedTab } = useNavigationContext();
  const { user } = useUserContext();
  const [visitors, setVisitors] = useState([]);
  const [screenMode, setScreenMode] = useState("initial");

  const validateVisitorData = (visitor) => {
    const requiredFields = ["id", "name", "document", "purpose", "departmentNumber", "whoAuthorizes", "status"];
    return requiredFields.every((field) => field in visitor && visitor[field] !== undefined && visitor[field] !== null);
  };

  useEffect(() => {
    const loadVisitors = async () => {
      try {
        const response = await fetch("https://tu-backend/api/visitantes", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar visitantes");
        }

        const data = await response.json();
        const validData = data.filter(validateVisitorData);
        setVisitors(validData);
      } catch (error) {
        console.error("Error al cargar visitantes:", error);
        const validMockData = mockVisitors.filter(validateVisitorData);
        setVisitors(validMockData);
      }
    };
    loadVisitors();
  }, []);

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

  const handleMarkExit = async (visitor) => {
    try {
      const response = await fetch(`https://tu-backend/api/visitantes/${visitor.id}/mark-exit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: "departed" }),
      });

      if (!response.ok) {
        throw new Error("Error al marcar la salida");
      }

      saveNotification(`Visitante ${visitor.name} ha salido.`);
      Alert.alert("Éxito", "Salida marcada correctamente.");
      setVisitors(visitors.filter((v) => v.id !== visitor.id));
    } catch (error) {
      console.error("Error al marcar salida:", error);
      saveNotification(`Visitante ${visitor.name} ha salido.`);
      Alert.alert("Éxito", "Salida marcada correctamente (simulado).");
      setVisitors(visitors.filter((v) => v.id !== visitor.id));
    }
  };

  const pendingVisitors = visitors.filter((v) => v.status === "pending");
  const scannedVisitors = visitors.filter((v) => v.status === "scanned");

  const getVisitorStatusColor = (status) => {
    switch (status) {
      case "pending":
        return COLORS.gray;
      case "scanned":
        return COLORS.success;
      default:
        return COLORS.black;
    }
  };

  const renderVisitor = ({ item, isPending }) => (
    <View style={[styles.visitorItem, { borderColor: getVisitorStatusColor(item.status) }]}>
      <View style={styles.visitorHeader}>
        <Icon name="person-outline" size={24} color={getVisitorStatusColor(item.status)} />
        <Text style={styles.visitorText}>{item.name}</Text>
      </View>
      <View style={styles.visitorInfo}>
        {!isPending && (
          <>
            <Text style={styles.visitorDetail}>
              <Text style={styles.label}>Documento:</Text> {item.document}
            </Text>
            <Text style={styles.visitorDetail}>
              <Text style={styles.label}>Motivo:</Text> {item.purpose}
            </Text>
            <Text style={styles.visitorDetail}>
              <Text style={styles.label}>Departamento:</Text> {item.departmentNumber}
            </Text>
            <Text style={styles.visitorDetail}>
              <Text style={styles.label}>Autorizado por:</Text> {item.whoAuthorizes}
            </Text>
            <Text style={styles.visitorDetail}>
              <Text style={styles.label}>Estado:</Text> Escaneado
            </Text>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => handleMarkExit(item)}
            >
              <Text style={styles.exitButtonText}>Marcar Salida</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (screenMode !== "initial") {
            setScreenMode("initial");
          } else {
            navigation.goBack();
          }
        }}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {role === "propietario" ? "Mis Visitantes" : "Visitantes"}
        </Text>
        <View style={{ width: 30 }} />
      </View>
      {screenMode === "initial" ? (
        <View style={styles.initialContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setScreenMode("pending")}
          >
            <Text style={styles.optionButtonText}>Visitantes Pendientes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setScreenMode("scanned")}
          >
            <Text style={styles.optionButtonText}>Visitantes Escaneados</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {screenMode === "pending" ? "Visitantes Pendientes" : "Visitantes Escaneados"}
            </Text>
            {screenMode === "pending" ? (
              pendingVisitors.length === 0 ? (
                <Text style={styles.message}>No hay visitantes pendientes.</Text>
              ) : (
                <FlatList
                  data={pendingVisitors}
                  renderItem={({ item }) => renderVisitor({ item, isPending: true })}
                  keyExtractor={(item) => `pending-${item.id}`}
                  contentContainerStyle={styles.list}
                />
              )
            ) : scannedVisitors.length === 0 ? (
              <Text style={styles.message}>No hay visitantes escaneados.</Text>
            ) : (
              <FlatList
                data={scannedVisitors}
                renderItem={({ item }) => renderVisitor({ item, isPending: false })}
                keyExtractor={(item) => `scanned-${item.id}`}
                contentContainerStyle={styles.list}
              />
            )}
          </View>
        </>
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
  initialContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
  },
  optionButton: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  optionButtonText: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
  },
  section: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginVertical: 10,
  },
  list: {
    paddingBottom: 10,
  },
  visitorItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 4,
  },
  visitorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  visitorText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginLeft: 10,
  },
  visitorInfo: {
    marginLeft: 34,
  },
  visitorDetail: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginBottom: 5,
  },
  label: {
    fontWeight: "bold",
    color: COLORS.black,
  },
  exitButton: {
    backgroundColor: COLORS.error,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  exitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  message: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    textAlign: "center",
  },
});