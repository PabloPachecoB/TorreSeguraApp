import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const mockEntries = [
  {
    id: "1",
    name: "Juan Pérez",
    type: "residente",
    status: "scanned",
    building: "Torre A",
    entryTime: "2025-04-30 08:00",
  },
  {
    id: "2",
    name: "Luis Rodríguez",
    type: "visitante",
    status: "scanned",
    document: "45678912",
    purpose: "Entrega",
    departmentNumber: "102",
    whoAuthorizes: "María Gómez",
    entryTime: "2025-04-30 09:15",
  },
  {
    id: "3",
    name: "María Gómez",
    type: "residente",
    status: "scanned",
    building: "Torre A",
    entryTime: "2025-04-30 10:30",
  },
];

export default function ListaTotalScreen({ navigation }) {
  const { selectedTab } = useNavigationContext();
  const { user } = useUserContext();
  const [entries, setEntries] = useState([]);

  // Cargar entradas desde el backend (simulado por ahora)
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const response = await fetch("https://tu-backend/api/entries", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar las entradas");
        }

        const data = await response.json();
        setEntries(data);
      } catch (error) {
        console.error("Error al cargar entradas:", error);
        setEntries(mockEntries);
      }
    };
    loadEntries();
  }, []);

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

  // Marcar la salida de una persona
  const handleMarkExit = async (entry) => {
    try {
      const response = await fetch(`https://tu-backend/api/entries/${entry.id}/mark-exit`, {
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

      saveNotification(`${entry.type === "residente" ? "Residente" : "Visitante"} ${entry.name} ha salido.`);
      Alert.alert("Éxito", "Salida marcada correctamente.");
      setEntries(entries.filter((e) => e.id !== entry.id));
    } catch (error) {
      console.error("Error al marcar salida:", error);
      saveNotification(`${entry.type === "residente" ? "Residente" : "Visitante"} ${entry.name} ha salido.`);
      Alert.alert("Éxito", "Salida marcada correctamente (simulado).");
      setEntries(entries.filter((e) => e.id !== entry.id));
    }
  };

  const getEntryTypeColor = (type) => {
    switch (type) {
      case "residente":
        return COLORS.primary;
      case "visitante":
        return COLORS.success;
      default:
        return COLORS.black;
    }
  };

  const renderEntry = ({ item }) => (
    <View style={[styles.entryItem, { borderColor: getEntryTypeColor(item.type) }]}>
      <View style={styles.entryHeader}>
        <Icon name={item.type === "residente" ? "person-outline" : "person-add-outline"} size={24} color={getEntryTypeColor(item.type)} />
        <Text style={styles.entryText}>{item.name}</Text>
      </View>
      <View style={styles.entryInfo}>
        <Text style={styles.entryDetail}>
          <Text style={styles.label}>Tipo:</Text> {item.type === "residente" ? "Residente" : "Visitante"}
        </Text>
        {item.type === "residente" ? (
          <Text style={styles.entryDetail}>
            <Text style={styles.label}>Edificio:</Text> {item.building}
          </Text>
        ) : (
          <>
            <Text style={styles.entryDetail}>
              <Text style={styles.label}>Documento:</Text> {item.document}
            </Text>
            <Text style={styles.entryDetail}>
              <Text style={styles.label}>Motivo:</Text> {item.purpose}
            </Text>
            <Text style={styles.entryDetail}>
              <Text style={styles.label}>Departamento:</Text> {item.departmentNumber}
            </Text>
            <Text style={styles.entryDetail}>
              <Text style={styles.label}>Autorizado por:</Text> {item.whoAuthorizes}
            </Text>
          </>
        )}
        <Text style={styles.entryDetail}>
          <Text style={styles.label}>Entrada:</Text> {item.entryTime}
        </Text>
        <Text style={styles.entryDetail}>
          <Text style={styles.label}>Estado:</Text> Ingresó
        </Text>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => handleMarkExit(item)}
        >
          <Text style={styles.exitButtonText}>Marcar Salida</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lista Total</Text>
        <View style={{ width: 30 }} />
      </View>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.message}>No hay entradas registradas.</Text>}
      />
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
  list: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  entryItem: {
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
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  entryText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginLeft: 10,
  },
  entryInfo: {
    marginLeft: 34,
  },
  entryDetail: {
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