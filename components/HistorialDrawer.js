// components/HistorialDrawer.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  PanResponder,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@expo/vector-icons/Ionicons";
import { COLORS, SIZES } from "../constants";
import ConversacionItem from "./ConversacionItem";

// Ancho del panel: 85% del ancho de pantalla, con tope para que en tablets
// no se convierta en una sábana. Se calcula al abrir para respetar rotación.
const PORCENTAJE_ANCHO = 0.85;
const ANCHO_MAXIMO = 340;
const DURACION_ANIMACION = 220;

/** Distancia mínima de arrastre horizontal antes de tomar el gesto como swipe. */
const UMBRAL_GESTO = 12;
/** Cuánto hay que arrastrar para que al soltar el drawer se cierre. */
const UMBRAL_CIERRE = 60;

/**
 * Panel lateral con el historial de conversaciones de la cuenta activa.
 * No conoce la fuente de datos: recibe todo por props desde ChatScreen.
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onCerrar
 * @param {Conversacion[]} props.conversaciones - Ya ordenadas por el service.
 * @param {boolean} props.cargando
 * @param {string|null} props.conversacionActivaId
 * @param {(id: string) => void} props.onSeleccionar
 * @param {() => void} props.onNuevaConversacion
 * @param {(id: string) => void} props.onEliminar
 */
export default function HistorialDrawer({
  visible,
  onCerrar,
  conversaciones = [],
  cargando = false,
  conversacionActivaId = null,
  onSeleccionar,
  onNuevaConversacion,
  onEliminar,
}) {
  const [busqueda, setBusqueda] = useState("");
  // Se mide al abrir, no al importar, para no quedar pegado a la orientación inicial.
  const [ancho, setAncho] = useState(
    () => Math.min(Dimensions.get("window").width * PORCENTAJE_ANCHO, ANCHO_MAXIMO)
  );

  // El Modal se desmonta al cerrar, así que hay que mantenerlo montado durante
  // la animación de salida: `montado` va un paso por detrás de `visible`.
  const [montado, setMontado] = useState(visible);
  const desplazamiento = useRef(new Animated.Value(-ancho)).current;

  // Espejos en ref de ancho y montado: los efectos de abajo los necesitan sin
  // meterlos en sus dependencias, que reiniciaría la animación a mitad de camino.
  const anchoRef = useRef(ancho);
  anchoRef.current = ancho;
  const montadoRef = useRef(montado);
  montadoRef.current = montado;

  // Fase 1 — abrir: montar el Modal. Cerrar: animar la salida y recién después
  // desmontar (si no, el panel desaparecería de golpe).
  useEffect(() => {
    if (visible) {
      setAncho(Math.min(Dimensions.get("window").width * PORCENTAJE_ANCHO, ANCHO_MAXIMO));
      setMontado(true);
      return;
    }
    // Nada que cerrar si nunca se abrió (evita animar en el primer render).
    if (!montadoRef.current) return;
    Animated.timing(desplazamiento, {
      toValue: -anchoRef.current,
      duration: DURACION_ANIMACION,
      useNativeDriver: true,
    }).start(() => {
      setMontado(false);
      setBusqueda(""); // Al reabrir, la búsqueda arranca limpia.
    });
  }, [visible, desplazamiento]);

  // Fase 2 — ya montado: deslizar el panel hacia adentro. Va en su propio efecto
  // para que la animación empiece con el Modal en pantalla y no se pierdan frames.
  useEffect(() => {
    if (!montado || !visible) return;
    desplazamiento.setValue(-anchoRef.current);
    Animated.timing(desplazamiento, {
      toValue: 0,
      duration: DURACION_ANIMACION,
      useNativeDriver: true,
    }).start();
  }, [montado, visible, desplazamiento]);

  // Overlay: opaco cuando el panel está afuera, transparente cuando está adentro.
  const opacidadOverlay = desplazamiento.interpolate({
    inputRange: [-ancho, 0],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Swipe hacia la izquierda para cerrar. PanResponder es API nativa de RN:
  // no hace falta sumar dependencias.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesto) =>
        gesto.dx < -UMBRAL_GESTO && Math.abs(gesto.dx) > Math.abs(gesto.dy),
      onPanResponderMove: (_evt, gesto) => {
        if (gesto.dx < 0) desplazamiento.setValue(gesto.dx);
      },
      onPanResponderRelease: (_evt, gesto) => {
        if (gesto.dx < -UMBRAL_CIERRE) {
          onCerrar();
        } else {
          // No llegó al umbral: vuelve a su sitio.
          Animated.timing(desplazamiento, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return conversaciones;
    return conversaciones.filter((c) => c.titulo.toLowerCase().includes(termino));
  }, [conversaciones, busqueda]);

  // "Vacío" = la cuenta no tiene historial. No cuenta como vacío una búsqueda
  // sin resultados: ahí sí hay conversaciones, solo que ninguna coincide.
  const estaVacio = !cargando && conversaciones.length === 0;

  const confirmarEliminar = (conversacion) => {
    Alert.alert(
      "Eliminar conversación",
      `¿Seguro que quieres eliminar "${conversacion.titulo}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => onEliminar(conversacion.id),
        },
      ]
    );
  };

  if (!montado) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <View style={styles.raiz}>
        {/* Overlay: oscurece el fondo y cierra al tocar fuera */}
        <Animated.View style={[styles.overlay, { opacity: opacidadOverlay }]}>
          <Pressable
            style={styles.overlayPressable}
            onPress={onCerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar historial"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            { width: ancho, transform: [{ translateX: desplazamiento }] },
          ]}
          {...panResponder.panHandlers}
        >
          <SafeAreaView style={styles.panelSeguro} edges={["top", "bottom", "left"]}>
            {/* Encabezado */}
            <View style={styles.encabezado}>
              <Text style={styles.encabezadoTitulo}>Historial</Text>
              <TouchableOpacity
                onPress={onCerrar}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Cerrar historial"
              >
                <Icon name="close" size={22} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.contenido}>
              {/* Con la cuenta sin historial el botón vive en el estado vacío,
                  centrado; mostrarlo aquí también sería duplicarlo. */}
              {!estaVacio && (
                <TouchableOpacity
                  style={styles.botonNueva}
                  onPress={onNuevaConversacion}
                  accessibilityRole="button"
                  accessibilityLabel="Iniciar una nueva conversación"
                >
                  <Icon name="add" size={18} color={COLORS.white} />
                  <Text style={styles.botonNuevaTexto}>Nueva conversación</Text>
                </TouchableOpacity>
              )}

              {/* El buscador solo estorba si hay poco que buscar */}
              {conversaciones.length > 3 && (
                <View style={styles.buscador}>
                  <Icon name="search" size={16} color={COLORS.gray} />
                  <TextInput
                    style={styles.buscadorInput}
                    placeholder="Buscar por título…"
                    placeholderTextColor={COLORS.gray}
                    value={busqueda}
                    onChangeText={setBusqueda}
                    accessibilityLabel="Buscar conversaciones por título"
                  />
                  {!!busqueda && (
                    <TouchableOpacity
                      onPress={() => setBusqueda("")}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Limpiar búsqueda"
                    >
                      <Icon name="close-circle" size={16} color={COLORS.gray} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {cargando ? (
                <View style={styles.centrado}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : (
                <FlatList
                  data={filtradas}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <ConversacionItem
                      conversacion={item}
                      activa={item.id === conversacionActivaId}
                      onSeleccionar={onSeleccionar}
                      onEliminar={confirmarEliminar}
                    />
                  )}
                  contentContainerStyle={
                    filtradas.length === 0 ? styles.listaVacia : styles.lista
                  }
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <EstadoVacio
                      hayBusqueda={!!busqueda.trim()}
                      onNuevaConversacion={onNuevaConversacion}
                    />
                  }
                />
              )}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Estado vacío del listado. Distingue "cuenta sin historial" de
 * "la búsqueda no encontró nada", que son problemas distintos.
 */
function EstadoVacio({ hayBusqueda, onNuevaConversacion }) {
  if (hayBusqueda) {
    return (
      <View style={styles.centrado}>
        <Icon name="search" size={32} color={COLORS.border} />
        <Text style={styles.vacioTexto}>Sin resultados para esa búsqueda.</Text>
      </View>
    );
  }

  return (
    <View style={styles.centrado}>
      <Icon name="chatbubble-ellipses-outline" size={40} color={COLORS.border} />
      <Text style={styles.vacioTitulo}>Aún no tienes conversaciones</Text>
      <Text style={styles.vacioTexto}>
        Cuando hables con el asistente, tus conversaciones aparecerán aquí.
      </Text>
      <TouchableOpacity
        style={styles.botonNuevaVacio}
        onPress={onNuevaConversacion}
        accessibilityRole="button"
        accessibilityLabel="Iniciar una nueva conversación"
      >
        <Icon name="add" size={18} color={COLORS.white} />
        <Text style={styles.botonNuevaTexto}>Nueva conversación</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  overlayPressable: {
    flex: 1,
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.white,
    // Sombra hacia la derecha para despegar el panel del contenido.
    shadowColor: COLORS.black,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 16,
  },
  panelSeguro: {
    flex: 1,
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  encabezadoTitulo: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "bold",
  },
  contenido: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  botonNueva: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  botonNuevaTexto: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontWeight: "600",
    marginLeft: 6,
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 38,
    marginBottom: 10,
  },
  buscadorInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: SIZES.fontSizeBody,
    color: COLORS.black,
    padding: 0, // Android agrega padding propio que descuadra la altura.
  },
  lista: {
    paddingBottom: 16,
  },
  listaVacia: {
    flexGrow: 1,
    justifyContent: "center",
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  vacioTitulo: {
    fontSize: SIZES.fontSizeSubtitle,
    fontWeight: "600",
    color: COLORS.black,
    marginTop: 12,
    textAlign: "center",
  },
  vacioTexto: {
    fontSize: SIZES.fontSizeSmall,
    color: COLORS.gray,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  botonNuevaVacio: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 18,
  },
});
