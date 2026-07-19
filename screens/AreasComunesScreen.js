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
import {
  obtenerAreas,
  obtenerDisponibilidad,
  crearReserva,
  obtenerMisReservas,
  cancelarReserva,
} from "../services/areasService";
// Se reutilizan las tarjetas del asistente para no reinventar el comprobante ni
// la tarjeta de error: son componentes de presentación agnósticos al dominio.
import TarjetaComprobante from "../components/agente/TarjetaComprobante";
import TarjetaError from "../components/agente/TarjetaError";

const hhmm = (t) => (t ? String(t).slice(0, 5) : "");

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

  // Disponibilidad (reemplaza los selectores de hora manuales por los slots
  // reales que devuelve el backend, para no dejar reservar horarios ocupados).
  const [slots, setSlots] = useState([]);
  const [alternativas, setAlternativas] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  // Resultado del flujo de reserva: o un comprobante real, o una tarjeta de
  // error. Nunca ambos, nunca un éxito ante un fallo.
  const [comprobante, setComprobante] = useState(null);
  const [reserveError, setReserveError] = useState(null);

  // "Mis reservas"
  const [misReservasVisible, setMisReservasVisible] = useState(false);
  const [misReservas, setMisReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [reservasError, setReservasError] = useState(null);

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

  // ─── Disponibilidad ────────────────────────────────────────────────────────

  /** Consulta disponibilidad de un área para una fecha y pinta los slots. */
  const cargarDisponibilidad = useCallback(async (areaId, fecha) => {
    if (!areaId || !fecha) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    setReserveError(null);
    try {
      const data = await obtenerDisponibilidad(areaId, fecha);
      setSlots(Array.isArray(data?.slots_disponibles) ? data.slots_disponibles : []);
      setAlternativas(Array.isArray(data?.alternativas) ? data.alternativas : []);
    } catch (error) {
      setSlots([]);
      setAlternativas([]);
      setReserveError({
        tipo: "error",
        titulo: "No se pudo consultar disponibilidad",
        mensaje: error?.message || "Intenta con otra fecha.",
      });
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const onSeleccionarFecha = (fecha) => {
    setReservationDate(fecha);
    setComprobante(null);
    if (selectedArea?.id != null) cargarDisponibilidad(selectedArea.id, fecha);
  };

  /** Salta a una de las fechas alternativas que sugiere el backend. */
  const onElegirAlternativa = (alt) => {
    const fecha = alt?.fecha || alt?.fecha_consultada;
    if (!fecha) return;
    setReservationDate(fecha);
    // Si la alternativa ya trae sus slots, se usan directo; si no, se consulta.
    if (Array.isArray(alt?.slots_disponibles) && alt.slots_disponibles.length) {
      setSlots(alt.slots_disponibles);
      setAlternativas([]);
      setSelectedSlot(null);
      setReserveError(null);
    } else if (selectedArea?.id != null) {
      cargarDisponibilidad(selectedArea.id, fecha);
    }
  };

  // ─── Reservar ──────────────────────────────────────────────────────────────

  const handleReserve = async () => {
    if (!reservationDate) {
      setReserveError({
        tipo: "error",
        titulo: "Falta la fecha",
        mensaje: "Selecciona una fecha para ver los horarios disponibles.",
      });
      return;
    }
    if (!selectedSlot) {
      setReserveError({
        tipo: "error",
        titulo: "Falta el horario",
        mensaje: "Elige uno de los horarios disponibles antes de confirmar.",
      });
      return;
    }

    setSubmitting(true);
    setReserveError(null);
    try {
      const respuesta = await crearReserva(selectedArea.id, {
        fecha: reservationDate,
        hora_inicio: selectedSlot.hora_inicio,
        hora_fin: selectedSlot.hora_fin,
        motivo: "",
      });
      // El endpoint responde con un sobre { mensaje, reserva: {...} }. El id, el
      // estado y demás datos reales viven en `reserva`, no en la raíz — por eso
      // el número salía vacío. Se desenvuelve (y se tolera un objeto directo).
      const reserva = respuesta?.reserva ?? respuesta;

      // Comprobante con el id y el estado REALES del backend (no un código
      // inventado). `reserva` viene con { id, areaNombre, fecha, hora_inicio,
      // hora_fin, estado: "confirmada", ... }.
      setComprobante({
        tipo: "comprobante",
        titulo: "Comprobante de reserva",
        icono: "checkmark-circle",
        encabezadoExito: "Reserva confirmada",
        estado: { texto: reserva?.estado || "confirmada", color: COLORS.success },
        campos: [
          { etiqueta: "Área", valor: reserva?.areaNombre || selectedArea?.nombre, icono: "business-outline" },
          { etiqueta: "Fecha", valor: reserva?.fecha || reservationDate, icono: "calendar-outline" },
          {
            etiqueta: "Horario",
            valor: `${hhmm(reserva?.hora_inicio || selectedSlot.hora_inicio)} - ${hhmm(reserva?.hora_fin || selectedSlot.hora_fin)}`,
            icono: "time-outline",
          },
        ],
        // Prioriza el id real; si por algún motivo no llega, muestra el estado
        // como referencia clara en lugar de un guion suelto.
        codigo:
          reserva?.id != null
            ? { etiqueta: "N.º de reserva", valor: `#${reserva.id}` }
            : { etiqueta: "Estado", valor: reserva?.estado || "Confirmada" },
      });
    } catch (error) {
      const status = error?.status;
      const faltantes = error?.data?.campos_faltantes;

      if (status === 400 && Array.isArray(faltantes) && faltantes.length) {
        setReserveError({
          tipo: "error",
          titulo: "Faltan datos",
          mensaje: `Revisa: ${faltantes.join(", ")}.`,
        });
      } else if (status === 400) {
        // Típicamente solape de horario: el slot que se veía libre ya no lo está.
        // Se refresca la disponibilidad para mostrar opciones actualizadas.
        setReserveError({
          tipo: "error",
          titulo: "Ese horario ya no está disponible",
          mensaje: error?.message || "Alguien reservó ese horario. Elige otro de la lista actualizada.",
        });
        cargarDisponibilidad(selectedArea.id, reservationDate);
      } else if (status === 403) {
        setReserveError({
          tipo: "error",
          titulo: "No autorizado",
          mensaje: "Solo los residentes pueden reservar áreas comunes.",
          permiteReintentar: false,
        });
      } else if (status === 404) {
        setReserveError({
          tipo: "error",
          titulo: "Área no disponible",
          mensaje: "Esta área ya no existe o no pertenece a tu edificio.",
          permiteReintentar: false,
        });
      } else {
        setReserveError({
          tipo: "error",
          titulo: "No se pudo reservar",
          mensaje: error?.message || "Ocurrió un error. Intenta de nuevo.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openReserveModal = (area) => {
    setSelectedArea(area);
    setReservationDate("");
    setSlots([]);
    setAlternativas([]);
    setSelectedSlot(null);
    setComprobante(null);
    setReserveError(null);
    setReserveModalVisible(true);
  };

  const closeReserveModal = () => {
    setReserveModalVisible(false);
    setSelectedArea(null);
    setReservationDate("");
    setSlots([]);
    setAlternativas([]);
    setSelectedSlot(null);
    setComprobante(null);
    setReserveError(null);
  };

  // ─── Mis reservas ──────────────────────────────────────────────────────────

  const cargarMisReservas = useCallback(async () => {
    setLoadingReservas(true);
    setReservasError(null);
    try {
      const data = await obtenerMisReservas();
      setMisReservas(Array.isArray(data) ? data : []);
    } catch (error) {
      setMisReservas([]);
      setReservasError({
        tipo: "error",
        titulo: "No se pudieron cargar tus reservas",
        mensaje: error?.message || "Intenta de nuevo.",
      });
    } finally {
      setLoadingReservas(false);
    }
  }, []);

  const openMisReservas = () => {
    setMisReservasVisible(true);
    cargarMisReservas();
  };

  const puedeCancelar = (estado) => {
    const e = (estado || "").toLowerCase();
    return e !== "cancelada" && e !== "completada";
  };

  const handleCancelar = (reserva) => {
    Alert.alert(
      "Cancelar reserva",
      `¿Cancelar la reserva de ${reserva?.areaNombre || "esta área"} del ${reserva?.fecha}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            setCancelandoId(reserva.id);
            setReservasError(null);
            try {
              await cancelarReserva(reserva.id);
              await cargarMisReservas();
            } catch (error) {
              if (error?.status === 409) {
                setReservasError({
                  tipo: "error",
                  titulo: "Ya no se puede cancelar",
                  mensaje: "Esta reserva ya estaba cancelada o completada.",
                  permiteReintentar: false,
                });
              } else if (error?.status === 403) {
                setReservasError({
                  tipo: "error",
                  titulo: "No autorizado",
                  mensaje: "No puedes cancelar esta reserva.",
                  permiteReintentar: false,
                });
              } else {
                setReservasError({
                  tipo: "error",
                  titulo: "No se pudo cancelar",
                  mensaje: error?.message || "Intenta de nuevo.",
                });
              }
            } finally {
              setCancelandoId(null);
            }
          },
        },
      ]
    );
  };

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
              <Text style={styles.infoText}>{hhmm(item.horario_inicio)} - {hhmm(item.horario_fin)}</Text>
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
                onPress={() => openReserveModal(item)}
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
        {role !== "portero" ? (
          <TouchableOpacity onPress={openMisReservas} accessibilityRole="button" accessibilityLabel="Ver mis reservas">
            <Icon name="list-outline" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 30 }} />
        )}
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
                  <Text style={styles.label}>Horario disponible:</Text> {hhmm(selectedArea.horario_inicio)} - {hhmm(selectedArea.horario_fin)}
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
              {/* Estado de éxito: comprobante real. Reemplaza el formulario. */}
              {comprobante ? (
                <View style={{ width: "100%" }}>
                  <TarjetaComprobante tarjeta={comprobante} onAccion={() => {}} />
                  <TouchableOpacity style={styles.closeButton} onPress={closeReserveModal}>
                    <Text style={styles.closeButtonText}>Listo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.modalTitle}>Reservar {selectedArea?.nombre}</Text>
                  {selectedArea?.imageUrl ? (
                    <Image source={{ uri: selectedArea.imageUrl }} style={styles.modalImage} />
                  ) : (
                    <View style={styles.modalIconPlaceholder}>
                      <Icon name={getAreaIcon(selectedArea?.nombre)} size={50} color={COLORS.secondary} />
                    </View>
                  )}

                  {/* Las "reglas del área" (sin vidrio, ducharse antes, etc.) NO
                      vienen del backend, así que no se muestran acá: mostrarlas
                      como si fueran del servidor sería inventar datos. */}

                  <Text style={styles.modalSubtitle}>Selecciona la fecha:</Text>
                  <Calendar
                    onDayPress={(day) => onSeleccionarFecha(day.dateString)}
                    markedDates={{ [reservationDate]: { selected: true, selectedColor: COLORS.primary } }}
                    minDate={new Date().toISOString().split("T")[0]}
                    theme={{
                      selectedDayBackgroundColor: COLORS.primary,
                      todayTextColor: COLORS.primary,
                      arrowColor: COLORS.primary,
                    }}
                    style={styles.calendar}
                  />

                  {/* Horarios disponibles del backend */}
                  {reservationDate ? (
                    <View style={styles.slotsSection}>
                      <Text style={styles.modalSubtitle}>Horarios disponibles:</Text>
                      {loadingSlots ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
                      ) : slots.length > 0 ? (
                        <View style={styles.slotsWrap}>
                          {slots.map((slot) => {
                            const activo =
                              selectedSlot?.hora_inicio === slot.hora_inicio &&
                              selectedSlot?.hora_fin === slot.hora_fin;
                            return (
                              <TouchableOpacity
                                key={`${slot.hora_inicio}-${slot.hora_fin}`}
                                style={[styles.slotChip, activo && styles.slotChipActivo]}
                                onPress={() => setSelectedSlot(slot)}
                              >
                                <Icon
                                  name="time-outline"
                                  size={14}
                                  color={activo ? COLORS.white : COLORS.primary}
                                />
                                <Text style={[styles.slotChipText, activo && styles.slotChipTextActivo]}>
                                  {hhmm(slot.hora_inicio)} - {hhmm(slot.hora_fin)}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : (
                        <View style={styles.noSlots}>
                          <Text style={styles.noSlotsText}>
                            No hay horarios libres ese día.
                          </Text>
                          {alternativas.length > 0 && (
                            <>
                              <Text style={[styles.modalSubtitle, { marginTop: 8 }]}>
                                Otras fechas con disponibilidad:
                              </Text>
                              <View style={styles.slotsWrap}>
                                {alternativas.map((alt, i) => (
                                  <TouchableOpacity
                                    key={alt?.fecha || i}
                                    style={styles.slotChip}
                                    onPress={() => onElegirAlternativa(alt)}
                                  >
                                    <Icon name="calendar-outline" size={14} color={COLORS.primary} />
                                    <Text style={styles.slotChipText}>{alt?.fecha || alt?.fecha_consultada}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  ) : null}

                  {/* Error del flujo de reserva (nunca junto a un éxito) */}
                  {reserveError && (
                    <View style={{ width: "100%", marginTop: 12 }}>
                      <TarjetaError
                        tarjeta={reserveError}
                        onAccion={() => {
                          setReserveError(null);
                          if (selectedArea?.id != null && reservationDate) {
                            cargarDisponibilidad(selectedArea.id, reservationDate);
                          }
                        }}
                      />
                    </View>
                  )}

                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={[styles.reserveButton, (submitting || !selectedSlot) && { opacity: 0.6 }]}
                      onPress={handleReserve}
                      disabled={submitting || !selectedSlot}
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
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Mis Reservas */}
      <Modal
        animationType="fade"
        transparent
        visible={misReservasVisible}
        onRequestClose={() => setMisReservasVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: "85%" }]}>
            <View style={styles.modalHeader}>
              <Icon name="calendar" size={30} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Mis reservas</Text>
            </View>

            {reservasError && (
              <View style={{ width: "100%", marginBottom: 10 }}>
                <TarjetaError tarjeta={reservasError} onAccion={() => { setReservasError(null); cargarMisReservas(); }} />
              </View>
            )}

            {loadingReservas ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ width: "100%" }}>
                {misReservas.length === 0 ? (
                  <Text style={styles.emptyText}>Todavía no tienes reservas.</Text>
                ) : (
                  misReservas.map((r) => (
                    <View key={String(r.id)} style={styles.reservaItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reservaArea}>{r.areaNombre || `Área ${r.area_comun}`}</Text>
                        <Text style={styles.reservaDetalle}>
                          {r.fecha} · {hhmm(r.hora_inicio)} - {hhmm(r.hora_fin)}
                        </Text>
                        <View style={[styles.estadoBadge, { backgroundColor: `${estadoColor(r.estado)}1A` }]}>
                          <Text style={[styles.estadoTexto, { color: estadoColor(r.estado) }]}>{r.estado}</Text>
                        </View>
                      </View>
                      {puedeCancelar(r.estado) && (
                        <TouchableOpacity
                          style={styles.cancelarReservaBtn}
                          onPress={() => handleCancelar(r)}
                          disabled={cancelandoId === r.id}
                        >
                          {cancelandoId === r.id ? (
                            <ActivityIndicator color={COLORS.error} size="small" />
                          ) : (
                            <Text style={styles.cancelarReservaTexto}>Cancelar</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={() => setMisReservasVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav selectedTab={selectedTab} navigation={navigation} />
    </SafeAreaView>
  );
}

const estadoColor = (estado) => {
  const e = (estado || "").toLowerCase();
  if (e === "cancelada") return COLORS.error;
  if (e === "completada") return COLORS.gray;
  return COLORS.success;
};

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
  emptyText: { marginTop: 12, fontSize: SIZES.fontSizeBody, color: COLORS.gray, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalScroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 30 },
  modalContainer: { backgroundColor: COLORS.white, padding: 20, borderRadius: SIZES.borderRadius, width: "90%", alignItems: "center" },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  modalTitle: { fontSize: SIZES.fontSizeSubtitle, fontFamily: "Roboto-Medium", fontWeight: "bold", color: COLORS.black, marginLeft: 10 },
  modalContent: { width: "100%", alignItems: "center" },
  modalImage: { width: 150, height: 150, borderRadius: 12, marginBottom: 20 },
  modalIconPlaceholder: { width: 120, height: 120, borderRadius: 12, backgroundColor: "#F0F4FF", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  modalDetail: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Regular", color: COLORS.black, marginBottom: 10 },
  label: { fontWeight: "bold", color: COLORS.black },
  modalSubtitle: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Medium", color: COLORS.black, marginBottom: 10, alignSelf: "flex-start" },
  calendar: { marginBottom: 20, width: "100%" },
  slotsSection: { width: "100%", marginBottom: 10 },
  slotsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  slotChipActivo: { backgroundColor: COLORS.primary },
  slotChipText: { fontSize: SIZES.fontSizeSmall, fontFamily: "Roboto-Medium", fontWeight: "600", color: COLORS.primary },
  slotChipTextActivo: { color: COLORS.white },
  noSlots: { width: "100%", marginTop: 4 },
  noSlotsText: { fontSize: SIZES.fontSizeBody, color: COLORS.gray },
  modalButtonContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 16 },
  reserveButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 5, flex: 1, alignItems: "center", marginRight: 5 },
  reserveButtonText: { color: COLORS.white, fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", fontWeight: "bold" },
  cancelButton: { backgroundColor: COLORS.gray, padding: 15, borderRadius: 5, flex: 1, alignItems: "center", marginLeft: 5 },
  cancelButtonText: { color: COLORS.white, fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", fontWeight: "bold" },
  closeButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 5, marginTop: 20, alignItems: "center", width: "60%", alignSelf: "center" },
  closeButtonText: { color: COLORS.white, fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Bold", fontWeight: "bold" },
  reservaItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  reservaArea: { fontSize: SIZES.fontSizeBody, fontFamily: "Roboto-Medium", fontWeight: "bold", color: COLORS.black },
  reservaDetalle: { fontSize: SIZES.fontSizeSmall, color: COLORS.gray, marginTop: 2 },
  estadoBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  estadoTexto: { fontSize: 11, fontFamily: "Roboto-Medium", fontWeight: "600", textTransform: "capitalize" },
  cancelarReservaBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.error, marginLeft: 10 },
  cancelarReservaTexto: { color: COLORS.error, fontSize: SIZES.fontSizeSmall, fontFamily: "Roboto-Medium", fontWeight: "600" },
});
