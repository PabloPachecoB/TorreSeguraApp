import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Calendar } from "react-native-calendars";
import Icon from "@expo/vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import { obtenerAreas, crearReserva } from "../services/areasService";

export default function AreasComunesScreen({ navigation, route }) {
  const role = route.params?.role || "propietario";
  const { selectedTab } = useNavigationContext();
  const { user } = useUserContext();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reserveModalVisible, setReserveModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [reservationDate, setReservationDate] = useState("");
  const [startHour, setStartHour] = useState(8);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(9);
  const [endMinute, setEndMinute] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadAreas = useCallback(async () => {
    try {
      const data = await obtenerAreas();
      setAreas(Array.isArray(data) ? data : []);
    } catch {
      setAreas([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadAreas();
      setLoading(false);
    };
    init();
  }, [loadAreas]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAreas();
    setRefreshing(false);
  }, [loadAreas]);

  const AREA_ICONS = {
    parrillero: "flame-outline",
    salon: "people-outline",
    reuniones: "chatbubbles-outline",
    parque: "leaf-outline",
    infantil: "happy-outline",
    gimnasio: "barbell-outline",
    piscina: "water-outline",
    terraza: "sunny-outline",
  };

  const getAreaIcon = (nombre) => {
    const lower = (nombre || "").toLowerCase();
    for (const [key, icon] of Object.entries(AREA_ICONS)) {
      if (lower.includes(key)) return icon;
    }
    return "business-outline";
  };

  const handleReserve = async () => {
    if (!reservationDate) {
      Alert.alert("Error", "Por favor, selecciona una fecha para la reserva.");
      return;
    }

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    if (endTimeInMinutes <= startTimeInMinutes) {
      Alert.alert("Error", "La hora de fin debe ser mayor que la hora de inicio.");
      return;
    }

    const hora_inicio = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;
    const hora_fin = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;

    setSubmitting(true);
    try {
      await crearReserva(selectedArea.id, {
        fecha: reservationDate,
        hora_inicio,
        hora_fin,
        motivo: "",
      });
      Alert.alert("Exito", `Area reservada: ${selectedArea.nombre} el ${reservationDate} de ${hora_inicio} a ${hora_fin}`);
      closeReserveModal();
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo realizar la reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeReserveModal = () => {
    setReserveModalVisible(false);
    setSelectedArea(null);
    setReservationDate("");
    setStartHour(8);
    setStartMinute(0);
    setEndHour(9);
    setEndMinute(0);
  };

  const incrementHour = (setter) => setter((prev) => (prev < 23 ? prev + 1 : 0));
  const decrementHour = (setter) => setter((prev) => (prev > 0 ? prev - 1 : 23));
  const incrementMinute = (setter) => setter((prev) => (prev < 55 ? prev + 5 : 0));
  const decrementMinute = (setter) => setter((prev) => (prev > 0 ? prev - 5 : 55));

  const renderArea = ({ item }) => {
    const hasImage = !!item.imageUrl;
    return (
      <View style={[styles.areaItem, { borderColor: COLORS.primary }]}>
        <View style={styles.areaHeader}>
          <Icon name={getAreaIcon(item.nombre)} size={24} color={COLORS.primary} />
          <Text style={styles.areaText}>{item.nombre}</Text>
        </View>
        {item.descripcion ? (
          <Text style={styles.areaDescription} numberOfLines={2}>{item.descripcion}</Text>
        ) : null}
        <View style={styles.areaInfoRow}>
          {item.capacidad_maxima ? (
            <View style={styles.infoBadge}>
              <Icon name="people-outline" size={14} color={COLORS.gray} />
              <Text style={styles.infoText}>{item.capacidad_maxima} pers.</Text>
            </View>
          ) : null}
          {item.horario_inicio && item.horario_fin ? (
            <View style={styles.infoBadge}>
              <Icon name="time-outline" size={14} color={COLORS.gray} />
              <Text style={styles.infoText}>{item.horario_inicio?.slice(0,5)} - {item.horario_fin?.slice(0,5)}</Text>
            </View>
          ) : null}
          {item.buildingName ? (
            <View style={styles.infoBadge}>
              <Icon name="business-outline" size={14} color={COLORS.gray} />
              <Text style={styles.infoText}>{item.buildingName}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.areaContent}>
          {hasImage ? (
            <Image source={{ uri: item.imageUrl }} style={styles.areaImage} />
          ) : (
            <View style={styles.areaIconPlaceholder}>
              <Icon name={getAreaIcon(item.nombre)} size={40} color={COLORS.secondary} />
            </View>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => { setSelectedArea(item); setModalVisible(true); }}
            >
              <Text style={styles.buttonText}>Ver Mas</Text>
            </TouchableOpacity>
            {role !== "portero" && (
              <TouchableOpacity
                style={styles.buttonReserve}
                onPress={() => { setSelectedArea(item); setReserveModalVisible(true); }}
              >
                <Icon name="calendar-outline" size={16} color={COLORS.white} />
                <Text style={styles.buttonText}> Reservar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando areas...</Text>
        </View>
        <BottomNav selectedTab={selectedTab} navigation={navigation} />
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
        <Text style={styles.headerTitle}>Areas Comunes</Text>
        <View style={{ width: 30 }} />
      </View>

      <FlatList
        data={areas}
        renderItem={renderArea}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Icon name="business-outline" size={48} color={COLORS.gray} />
            <Text style={styles.emptyText}>No hay areas comunes disponibles.</Text>
          </View>
        }
      />

      {/* Modal Ver Mas */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => { setModalVisible(false); setSelectedArea(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Icon name="home-outline" size={40} color={COLORS.primary} />
              <Text style={styles.modalTitle}>{selectedArea?.nombre || selectedArea?.name}</Text>
            </View>
            <View style={styles.modalContent}>
              {selectedArea?.imageUrl ? (
                <Image source={{ uri: selectedArea.imageUrl }} style={styles.modalImage} />
              ) : (
                <View style={styles.modalIconPlaceholder}>
                  <Icon name={getAreaIcon(selectedArea?.nombre)} size={60} color={COLORS.secondary} />
                </View>
              )}
              {selectedArea?.descripcion ? (
                <Text style={styles.modalDetail}>{selectedArea.descripcion}</Text>
              ) : null}
              {selectedArea?.capacidad_maxima ? (
                <Text style={styles.modalDetail}>
                  <Text style={styles.label}>Capacidad maxima:</Text> {selectedArea.capacidad_maxima} personas
                </Text>
              ) : null}
              {selectedArea?.horario_inicio && selectedArea?.horario_fin ? (
                <Text style={styles.modalDetail}>
                  <Text style={styles.label}>Horario disponible:</Text> {selectedArea.horario_inicio?.slice(0,5)} - {selectedArea.horario_fin?.slice(0,5)}
                </Text>
              ) : null}
              {selectedArea?.buildingName ? (
                <Text style={styles.modalDetail}>
                  <Text style={styles.label}>Edificio:</Text> {selectedArea.buildingName}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => { setModalVisible(false); setSelectedArea(null); }}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Reservar */}
      <Modal
        animationType="fade"
        transparent
        visible={reserveModalVisible}
        onRequestClose={closeReserveModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Reservar {selectedArea?.nombre}</Text>
              {selectedArea?.imageUrl ? (
                <Image source={{ uri: selectedArea.imageUrl }} style={styles.modalImage} />
              ) : (
                <View style={styles.modalIconPlaceholder}>
                  <Icon name={getAreaIcon(selectedArea?.nombre)} size={50} color={COLORS.secondary} />
                </View>
              )}
              <Text style={styles.modalSubtitle}>Selecciona la fecha:</Text>
              <Calendar
                onDayPress={(day) => setReservationDate(day.dateString)}
                markedDates={{ [reservationDate]: { selected: true, selectedColor: COLORS.primary } }}
                minDate={new Date().toISOString().split("T")[0]}
                theme={{
                  selectedDayBackgroundColor: COLORS.primary,
                  todayTextColor: COLORS.primary,
                  arrowColor: COLORS.primary,
                }}
                style={styles.calendar}
              />
              <View style={styles.timePickerContainer}>
                <View style={styles.timePicker}>
                  <Text style={styles.modalSubtitle}>Hora Inicio:</Text>
                  <View style={styles.timeSelector}>
                    <View style={styles.timeUnit}>
                      <TouchableOpacity style={styles.timeButton} onPress={() => incrementHour(setStartHour)}>
                        <Icon name="chevron-up" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                      <Text style={styles.timeText}>{String(startHour).padStart(2, "0")}</Text>
                      <TouchableOpacity style={styles.timeButton} onPress={() => decrementHour(setStartHour)}>
                        <Icon name="chevron-down" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.timeSeparator}>:</Text>
                    <View style={styles.timeUnit}>
                      <TouchableOpacity style={styles.timeButton} onPress={() => incrementMinute(setStartMinute)}>
                        <Icon name="chevron-up" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                      <Text style={styles.timeText}>{String(startMinute).padStart(2, "0")}</Text>
                      <TouchableOpacity style={styles.timeButton} onPress={() => decrementMinute(setStartMinute)}>
                        <Icon name="chevron-down" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={styles.timePicker}>
                  <Text style={styles.modalSubtitle}>Hora Fin:</Text>
                  <View style={styles.timeSelector}>
                    <View style={styles.timeUnit}>
                      <TouchableOpacity style={styles.timeButton} onPress={() => incrementHour(setEndHour)}>
                        <Icon name="chevron-up" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                      <Text style={styles.timeText}>{String(endHour).padStart(2, "0")}</Text>
                      <TouchableOpacity style={styles.timeButton} onPress={() => decrementHour(setEndHour)}>
                        <Icon name="chevron-down" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.timeSeparator}>:</Text>
                    <View style={styles.timeUnit}>
                      <TouchableOpacity style={styles.timeButton} onPress={() => incrementMinute(setEndMinute)}>
                        <Icon name="chevron-up" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                      <Text style={styles.timeText}>{String(endMinute).padStart(2, "0")}</Text>
                      <TouchableOpacity style={styles.timeButton} onPress={() => decrementMinute(setEndMinute)}>
                        <Icon name="chevron-down" size={20} color={COLORS.black} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.reserveButton, submitting && { opacity: 0.6 }]}
                  onPress={handleReserve}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.reserveButtonText}>Confirmar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={closeReserveModal}>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SIZES.padding, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.fontSizeTitle, fontFamily: "Roboto-Bold", fontWeight: "bold", color: COLORS.black },
  list: { padding: SIZES.padding, paddingBottom: 100 },
  areaItem: {
    backgroundColor: COLORS.white, padding: 15, borderRadius: SIZES.borderRadius,
    marginBottom: 10, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderLeftWidth: 4,
  },
  areaHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  areaText: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Medium", fontWeight: "bold", color: COLORS.black, marginLeft: 10 },
  areaDescription: { fontSize: SIZES.fontSizeSmall, color: COLORS.gray, marginBottom: 8, marginLeft: 34 },
  areaInfoRow: { flexDirection: "row", flexWrap: "wrap", marginLeft: 34, marginBottom: 10, gap: 8 },
  infoBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0F4FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  infoText: { fontSize: 12, color: COLORS.gray, fontFamily: "Roboto-Regular" },
  areaContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  areaImage: { width: 80, height: 80, borderRadius: 12, marginRight: 10 },
  areaIconPlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: "#F0F4FF", justifyContent: "center", alignItems: "center", marginRight: 10 },
  buttonContainer: { flex: 1, flexDirection: "row", flexWrap: "wrap", marginRight: -10, marginBottom: -10 },
  button: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, marginRight: 10, marginBottom: 10 },
  buttonReserve: { backgroundColor: COLORS.success, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, marginRight: 10, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  buttonText: { color: COLORS.white, fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", fontWeight: "bold" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
  loadingText: { marginTop: 12, fontSize: SIZES.fontSizeBody, color: COLORS.gray },
  emptyText: { marginTop: 12, fontSize: SIZES.fontSizeBody, color: COLORS.gray },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalScroll: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: COLORS.white, padding: 20, borderRadius: SIZES.borderRadius, width: "90%", alignItems: "center" },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  modalTitle: { fontSize: SIZES.fontSizeSubtitle, fontFamily: "Roboto-Medium", fontWeight: "bold", color: COLORS.black, marginLeft: 10 },
  modalContent: { width: "100%", alignItems: "center" },
  modalImage: { width: 150, height: 150, borderRadius: 12, marginBottom: 20 },
  modalIconPlaceholder: { width: 120, height: 120, borderRadius: 12, backgroundColor: "#F0F4FF", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  modalDetail: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: COLORS.black, marginBottom: 10 },
  label: { fontWeight: "bold", color: COLORS.black },
  modalSubtitle: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Medium", color: COLORS.black, marginBottom: 10 },
  calendar: { marginBottom: 20, width: "100%" },
  timePickerContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 20 },
  timePicker: { alignItems: "center" },
  timeSelector: { flexDirection: "row", alignItems: "center" },
  timeUnit: { alignItems: "center", marginHorizontal: 5 },
  timeButton: { padding: 5 },
  timeText: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: COLORS.black, marginVertical: 5 },
  timeSeparator: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: COLORS.black, marginHorizontal: 5 },
  modalButtonContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 10 },
  reserveButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 5, flex: 1, alignItems: "center", marginRight: 5 },
  reserveButtonText: { color: COLORS.white, fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", fontWeight: "bold" },
  cancelButton: { backgroundColor: COLORS.gray, padding: 15, borderRadius: 5, flex: 1, alignItems: "center", marginLeft: 5 },
  cancelButtonText: { color: COLORS.white, fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", fontWeight: "bold" },
  closeButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 5, marginTop: 20, alignItems: "center", width: "50%" },
  closeButtonText: { color: COLORS.white, fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", fontWeight: "bold" },
});
