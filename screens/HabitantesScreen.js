import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";

const mockResidents = [
  {
    id: "1",
    user: "Juan Pérez",
    building: "Torre A",
    vehicles: 2,
    residentType: "dueño",
    additionalInfo: {
      apartment: "101",
      contactNumber: "123456789",
      email: "juan.perez@email.com",
    },
  },
  {
    id: "2",
    user: "María Gómez",
    building: "Torre A",
    vehicles: 1,
    residentType: "copropietario",
    additionalInfo: {
      apartment: "102",
      contactNumber: "987654321",
      email: "maria.gomez@email.com",
    },
  },
  {
    id: "3",
    user: "Luis Rodríguez",
    building: "Torre B",
    vehicles: 0,
    residentType: "menor",
    additionalInfo: {
      apartment: "201",
      contactNumber: "N/A",
      email: "N/A",
    },
  },
  {
    id: "4",
    user: "Ana Martínez",
    building: "Torre B",
    vehicles: 1,
    residentType: "titular",
    additionalInfo: {
      apartment: "202",
      contactNumber: "456789123",
      email: "ana.martinez@email.com",
    },
  },
];

export default function HabitantesScreen({ navigation }) {
  const { selectedTab } = useNavigationContext();
  const { user } = useUserContext();
  const [residents, setResidents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);

  // Cargar residentes desde el backend (simulado por ahora)
  useEffect(() => {
    const loadResidents = async () => {
      try {
        const response = await fetch("https://tu-backend/api/residents", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`, // Asegúrate de que el token esté disponible en user.token
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar residentes");
        }

        const data = await response.json();
        // Opcional: Filtrar o validar datos si es necesario
        setResidents(data);
      } catch (error) {
        console.error("Error al cargar residentes:", error);
        // Usamos datos simulados mientras el backend no está disponible
        setResidents(mockResidents);
      }
    };
    loadResidents();
  }, []);

  const handleResidentPress = (resident) => {
    setSelectedResident(resident);
    setModalVisible(true);
  };

  // Determinar el color del borde según el tipo de residente
  const getResidentTypeColor = (type) => {
    switch (type) {
      case "dueño":
        return COLORS.primary;
      case "copropietario":
        return COLORS.secondary;
      case "menor":
        return COLORS.gray;
      case "titular":
        return COLORS.success;
      default:
        return COLORS.black;
    }
  };

  const renderResident = ({ item }) => (
    <TouchableOpacity
      style={[styles.residentItem, { borderColor: getResidentTypeColor(item.residentType) }]}
      onPress={() => handleResidentPress(item)}
    >
      <View style={styles.residentHeader}>
        <Icon name="person-outline" size={24} color={getResidentTypeColor(item.residentType)} />
        <Text style={styles.residentText}>{item.user}</Text>
      </View>
      <View style={styles.residentInfo}>
        <Text style={styles.residentDetail}>
          <Text style={styles.label}>Edificio:</Text> {item.building}
        </Text>
        <Text style={styles.residentDetail}>
          <Text style={styles.label}>Vehículos:</Text> {item.vehicles}
        </Text>
        <Text style={styles.residentDetail}>
          <Text style={styles.label}>Tipo:</Text> {item.residentType}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Habitantes</Text>
        <View style={{ width: 30 }} />
      </View>
      <FlatList
        data={residents}
        renderItem={renderResident}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.message}>No hay residentes registrados.</Text>}
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedResident(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Icon
                name="person-circle-outline"
                size={40}
                color={getResidentTypeColor(selectedResident?.residentType)}
              />
              <Text style={styles.modalTitle}>{selectedResident?.user}</Text>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalDetail}>
                <Text style={styles.label}>Edificio:</Text> {selectedResident?.building}
              </Text>
              <Text style={styles.modalDetail}>
                <Text style={styles.label}>Apartamento:</Text> {selectedResident?.additionalInfo?.apartment}
              </Text>
              <Text style={styles.modalDetail}>
                <Text style={styles.label}>Vehículos:</Text> {selectedResident?.vehicles}
              </Text>
              <Text style={styles.modalDetail}>
                <Text style={styles.label}>Tipo de Residente:</Text> {selectedResident?.residentType}
              </Text>
              <Text style={styles.modalDetail}>
                <Text style={styles.label}>Teléfono:</Text> {selectedResident?.additionalInfo?.contactNumber}
              </Text>
              <Text style={styles.modalDetail}>
                <Text style={styles.label}>Correo:</Text> {selectedResident?.additionalInfo?.email}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSelectedResident(null);
              }}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
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
  list: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  residentItem: {
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
  residentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  residentText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginLeft: 10,
  },
  residentInfo: {
    marginLeft: 34, // Alineado con el texto del nombre (ícono + margen)
  },
  residentDetail: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginBottom: 5,
  },
  label: {
    fontWeight: "bold",
    color: COLORS.black,
  },
  message: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 20,
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
    width: "90%",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginLeft: 10,
  },
  modalContent: {
    width: "100%",
  },
  modalDetail: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginBottom: 10,
  },
  label: {
    fontWeight: "bold",
    color: COLORS.black,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
    width: "50%",
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
});