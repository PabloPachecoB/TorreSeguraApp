import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const mockAreas = [
  {
    id: "1",
    name: "Parrillero Monte Negro",
    image: require("../assets/imgParrillero.png"),
  },
  {
    id: "2",
    name: "Sala de Reuniones Muguel",
    image: require("../assets/imgSaladerunion.png"),
  },
  {
    id: "3",
    name: "Parque Nidito Feliz",
    image: require("../assets/imgParque.png"),
  },
];

export default function AreasComunesScreen({ navigation, route }) {
  const role = route.params?.role || "propietario";
  const { selectedTab } = useNavigationContext();
  const { user } = useUserContext();
  const [areas, setAreas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [reserveModalVisible, setReserveModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [reservationDate, setReservationDate] = useState("");
  const [startHour, setStartHour] = useState(8);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(9);
  const [endMinute, setEndMinute] = useState(0);

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const response = await fetch("https://tu-backend/api/common-areas", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar áreas comunes");
        }

        const data = await response.json();
        setAreas(data);
      } catch (error) {
        console.error("Error al cargar áreas comunes:", error);
        setAreas(mockAreas);
      }
    };
    loadAreas();
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

  const handleReserve = async () => {
    if (!reservationDate) {
      Alert.alert("Error", "Por favor, selecciona una fecha para la reserva.");
      return;
    }

    // Validar que la hora de finalización sea mayor que la hora de inicio
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    if (endTimeInMinutes <= startTimeInMinutes) {
      Alert.alert("Error", "La hora de finalización debe ser mayor que la hora de inicio.");
      return;
    }

    const startTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`;
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

    try {
      const response = await fetch("https://tu-backend/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          areaId: selectedArea.id,
          areaName: selectedArea.name,
          date: reservationDate,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al realizar la reserva");
      }

      saveNotification(`Área reservada: ${selectedArea.name} el ${reservationDate} de ${startTime} a ${endTime}`);
      Alert.alert("Éxito", "Área reservada correctamente.");
      setReserveModalVisible(false);
      setReservationDate("");
      setStartHour(8);
      setStartMinute(0);
      setEndHour(9);
      setEndMinute(0);
      setSelectedArea(null);
    } catch (error) {
      console.error("Error al reservar área:", error);
      saveNotification(`Área reservada: ${selectedArea.name} el ${reservationDate} de ${startTime} a ${endTime}`);
      Alert.alert("Éxito", "Área reservada correctamente (simulado).");
      setReserveModalVisible(false);
      setReservationDate("");
      setStartHour(8);
      setStartMinute(0);
      setEndHour(9);
      setEndMinute(0);
      setSelectedArea(null);
    }
  };

  const incrementHour = (setter, hour) => {
    setter((prev) => (prev < 23 ? prev + 1 : 0));
  };

  const decrementHour = (setter, hour) => {
    setter((prev) => (prev > 0 ? prev - 1 : 23));
  };

  const incrementMinute = (setter, minute) => {
    setter((prev) => (prev < 55 ? prev + 5 : 0));
  };

  const decrementMinute = (setter, minute) => {
    setter((prev) => (prev > 0 ? prev - 5 : 55));
  };

  const renderArea = ({ item }) => (
    <View style={[styles.areaItem, { borderColor: COLORS.primary }]}>
      <View style={styles.areaHeader}>
        <Icon name="home-outline" size={24} color={COLORS.primary} />
        <Text style={styles.areaText}>{item.name}</Text>
      </View>
      <View style={styles.areaContent}>
        <Image source={item.image} style={styles.areaImage} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setSelectedArea(item);
              setModalVisible(true);
            }}
          >
            <Text style={styles.buttonText}>Ver Más</Text>
          </TouchableOpacity>
          {role !== "portero" && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setSelectedArea(item);
                setReserveModalVisible(true);
              }}
            >
              <Text style={styles.buttonText}>Reservar</Text>
            </TouchableOpacity>
          )}
        </View>
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
        <Text style={styles.headerTitle}>Áreas Comunes</Text>
        <View style={{ width: 30 }} />
      </View>
      <FlatList
        data={areas}
        renderItem={renderArea}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      {/* Modal para Ver Más */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedArea(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Icon name="home-outline" size={40} color={COLORS.primary} />
              <Text style={styles.modalTitle}>{selectedArea?.name}</Text>
            </View>
            <View style={styles.modalContent}>
              <Image source={selectedArea?.image} style={styles.modalImage} />
              <Text style={styles.modalDetail}>
                <Text style={styles.label}>Nombre:</Text> {selectedArea?.name}
              </Text>
              <Text style={styles.message}>Más detalles estarán disponibles pronto.</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSelectedArea(null);
              }}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal para Reservar */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reserveModalVisible}
        onRequestClose={() => {
          setReserveModalVisible(false);
          setSelectedArea(null);
          setReservationDate("");
          setStartHour(8);
          setStartMinute(0);
          setEndHour(9);
          setEndMinute(0);
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Reservar {selectedArea?.name}</Text>
              <Image source={selectedArea?.image} style={styles.modalImage} />
              <Text style={styles.modalSubtitle}>Selecciona la fecha:</Text>
              <Calendar
                onDayPress={(day) => setReservationDate(day.dateString)}
                markedDates={{
                  [reservationDate]: { selected: true, selectedColor: COLORS.primary },
                }}
                theme={{
                  selectedDayBackgroundColor: COLORS.primary,
                  todayTextColor: COLORS.primary,
                  arrowColor: COLORS.primary,
                }}
                style={styles.calendar}
              />
              <View style={styles.timePickerContainer}>
                <View style={styles.timePicker}>
                  <Text style={styles.modalSubtitle}>Hora de Inicio:</Text>
                  <View style={styles.timeSelector}>
                    <View style={styles.timeUnit}>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => incrementHour(setStartHour, startHour)}
                      >
                        <Icon name="chevron-up" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                      <Text style={styles.timeText}>{startHour.toString().padStart(2, "0")}</Text>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => decrementHour(setStartHour, startHour)}
                      >
                        <Icon name="chevron-down" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.timeSeparator}>:</Text>
                    <View style={styles.timeUnit}>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => incrementMinute(setStartMinute, startMinute)}
                      >
                        <Icon name="chevron-up" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                      <Text style={styles.timeText}>{startMinute.toString().padStart(2, "0")}</Text>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => decrementMinute(setStartMinute, startMinute)}
                      >
                        <Icon name="chevron-down" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={styles.timePicker}>
                  <Text style={styles.modalSubtitle}>Hora de Fin:</Text>
                  <View style={styles.timeSelector}>
                    <View style={styles.timeUnit}>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => incrementHour(setEndHour, endHour)}
                      >
                        <Icon name="chevron-up" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                      <Text style={styles.timeText}>{endHour.toString().padStart(2, "0")}</Text>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => decrementHour(setEndHour, endHour)}
                      >
                        <Icon name="chevron-down" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.timeSeparator}>:</Text>
                    <View style={styles.timeUnit}>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => incrementMinute(setEndMinute, endMinute)}
                      >
                        <Icon name="chevron-up" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                      <Text style={styles.timeText}>{endMinute.toString().padStart(2, "0")}</Text>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => decrementMinute(setEndMinute, endMinute)}
                      >
                        <Icon name="chevron-down" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={styles.reserveButton} onPress={handleReserve}>
                  <Text style={styles.reserveButtonText}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setReserveModalVisible(false);
                    setSelectedArea(null);
                    setReservationDate("");
                    setStartHour(8);
                    setStartMinute(0);
                    setEndHour(9);
                    setEndMinute(0);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  areaItem: {
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
  areaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  areaText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginLeft: 10,
  },
  areaContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  areaImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 10,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: {
    flexGrow: 1,
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
    alignItems: "center",
  },
  modalImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
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
  modalSubtitle: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    color: COLORS.black,
    marginBottom: 10,
  },
  calendar: {
    marginBottom: 20,
    width: "100%",
  },
  timePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  timePicker: {
    alignItems: "center",
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeUnit: {
    alignItems: "center",
    marginHorizontal: 5,
  },
  timeButton: {
    padding: 5,
  },
  timeText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginVertical: 5,
  },
  timeSeparator: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginHorizontal: 5,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  reserveButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 5,
  },
  reserveButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginLeft: 5,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
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
  message: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 20,
  },
});