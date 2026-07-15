// screens/ChatScreen.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "@expo/vector-icons/Ionicons";
import { COLORS, MODO_DEMO_AGENTE } from "../constants";
import { enviarMensajeAgente, ejecutarAccionAgente } from "../services/agenteService";
import { useUserContext } from "../context/UserContext";
import HistorialDrawer from "../components/HistorialDrawer";
import TarjetaMensaje from "../components/agente/TarjetaMensaje";
import BurbujaEscribiendo from "../components/agente/BurbujaEscribiendo";
import { ACCION_REINTENTAR } from "../components/agente/TarjetaError";
import {
  getConversaciones,
  getConversacion,
  crearConversacion,
  guardarMensaje,
  guardarIdAgente,
  eliminarConversacion,
} from "../services/conversacionesService";

const MENSAJE_BIENVENIDA = {
  id: "bienvenida",
  rol: "asistente",
  contenido:
    "¡Hola! Soy el asistente de TorreSegura. Cuéntame qué problema encontraste en el edificio (por ejemplo: \"hay una fuga de agua en el pasillo del piso 3\") y me encargo de gestionarlo.",
};

/** "09:41" — el formato de hora que muestran las burbujas. */
const horaActual = () =>
  new Date().toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/** Mensaje de error con tarjeta de reintento. Nunca finge que la acción salió bien. */
const mensajeError = (detalle) => ({
  id: `e-${Date.now()}`,
  rol: "asistente",
  contenido: "",
  hora: horaActual(),
  esError: true,
  tarjeta: {
    tipo: "error",
    mensaje:
      "No pude completar la acción. Verifica tu conexión e intenta de nuevo, o reporta el problema desde el módulo de Alertas.",
    detalle,
  },
});

export default function ChatScreen({ navigation }) {
  const { user } = useUserContext();
  // El backend futuro devolverá un id propio; hoy la cuenta se identifica por
  // username (es lo que guarda UserContext). Esta línea es el único punto que
  // decide "quién es el dueño del historial".
  const userId = user?.id ?? user?.username ?? null;

  const [mensajes, setMensajes] = useState([MENSAJE_BIENVENIDA]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Ids de los mensajes cuya tarjeta ya se confirmó o canceló: se les ocultan
  // las acciones para no poder confirmar dos veces la misma reserva.
  const [tarjetasResueltas, setTarjetasResueltas] = useState([]);

  // Historial
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [conversaciones, setConversaciones] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [conversacionActivaId, setConversacionActivaId] = useState(null);

  // Dos ids distintos, a propósito:
  // - conversacionIdRef: id local del historial (capa mock).
  // - agenteConversacionIdRef: id del hilo del agente, lo devuelve /agente/chat/.
  // Viven en refs porque handleEnviar necesita el valor actual sin re-crearse.
  const conversacionIdRef = useRef(null);
  const agenteConversacionIdRef = useRef(null);
  // Estado del simulador. Opaco a propósito: ChatScreen no lo interpreta, solo
  // lo devuelve tal cual. Al conectar el backend, esto deja de usarse.
  const estadoDemoRef = useRef(undefined);
  // Último intento, para que "Reintentar" sepa qué repetir.
  const ultimoIntentoRef = useRef(null);
  const listRef = useRef(null);

  const scrollAlFinal = useCallback(() => {
    // Pequeño delay para que el FlatList ya tenga el mensaje nuevo
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  /** Refresca el listado del drawer desde la capa de datos. */
  const cargarHistorial = useCallback(async () => {
    if (!userId) return;
    setCargandoHistorial(true);
    try {
      const lista = await getConversaciones(userId);
      setConversaciones(lista);
    } catch (error) {
      // El historial es secundario: si falla, el chat debe seguir usable.
      setConversaciones([]);
    } finally {
      setCargandoHistorial(false);
    }
  }, [userId]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  /** Persiste un mensaje en la conversación activa y refresca el listado. */
  const persistirMensaje = useCallback(
    async (mensaje) => {
      if (!userId || !conversacionIdRef.current) return;
      try {
        await guardarMensaje(userId, conversacionIdRef.current, mensaje);
        await cargarHistorial();
      } catch (error) {
        // Falla el guardado local: el chat en pantalla no se ve afectado.
      }
    },
    [userId, cargarHistorial]
  );

  /** Agrega la respuesta del asistente (texto + tarjeta opcional) y la persiste. */
  const agregarRespuesta = useCallback(
    async (data) => {
      estadoDemoRef.current = data?.estado;

      if (data?.conversacion_id) {
        agenteConversacionIdRef.current = data.conversacion_id;
        if (userId && conversacionIdRef.current) {
          await guardarIdAgente(userId, conversacionIdRef.current, data.conversacion_id);
        }
      }

      const msgAgente = {
        id: `a-${Date.now()}`,
        rol: "asistente",
        contenido: data?.respuesta || "Recibido. Estoy procesando tu solicitud.",
        hora: horaActual(),
        tarjeta: data?.tarjeta,
      };
      setMensajes((prev) => [...prev, msgAgente]);
      await persistirMensaje(msgAgente);
    },
    [userId, persistirMensaje]
  );

  /** Crea la conversación local si es el primer mensaje del chat. */
  const asegurarConversacion = useCallback(
    async (hora) => {
      // Recién acá nace la conversación, para no llenar el historial de chats
      // vacíos que el usuario abrió y abandonó.
      if (!userId || conversacionIdRef.current) return;
      try {
        const nueva = await crearConversacion(userId);
        conversacionIdRef.current = nueva.id;
        setConversacionActivaId(nueva.id);
        // El saludo se guarda también, para que al reabrir el chat se lea completo.
        await guardarMensaje(userId, nueva.id, { ...MENSAJE_BIENVENIDA, hora });
      } catch (error) {
        // Sin conversación creada el chat sigue funcionando, solo no se historiza.
      }
    },
    [userId]
  );

  /** Envía texto del usuario al agente. */
  const enviarTexto = useCallback(
    async (mensaje) => {
      const hora = horaActual();
      const msgUsuario = {
        id: `u-${Date.now()}`,
        rol: "usuario",
        contenido: mensaje,
        hora,
      };
      setMensajes((prev) => [...prev, msgUsuario]);
      setEnviando(true);
      scrollAlFinal();

      await asegurarConversacion(hora);
      await persistirMensaje(msgUsuario);

      ultimoIntentoRef.current = { tipo: "mensaje", mensaje };

      try {
        const data = await enviarMensajeAgente({
          mensaje,
          conversacionId: agenteConversacionIdRef.current,
          estadoDemo: estadoDemoRef.current,
        });
        await agregarRespuesta(data);
      } catch (error) {
        // Los errores no se guardan en el historial: son de esta sesión.
        setMensajes((prev) => [...prev, mensajeError(error?.message)]);
      } finally {
        setEnviando(false);
        scrollAlFinal();
      }
    },
    [asegurarConversacion, persistirMensaje, agregarRespuesta, scrollAlFinal]
  );

  const handleEnviar = () => {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;
    setTexto("");
    enviarTexto(mensaje);
  };

  /** Ejecuta la acción de una tarjeta y encadena la respuesta del asistente. */
  const handleAccion = async (mensajeId, actionId) => {
    if (enviando) return;

    // Reintentar no es una acción del agente: repite el último intento fallido.
    if (actionId === ACCION_REINTENTAR) {
      const intento = ultimoIntentoRef.current;
      if (!intento) return;
      if (intento.tipo === "mensaje") return enviarTexto(intento.mensaje);
      return ejecutarAccion(intento.mensajeId, intento.actionId);
    }

    return ejecutarAccion(mensajeId, actionId);
  };

  const ejecutarAccion = async (mensajeId, actionId) => {
    setEnviando(true);
    // La tarjeta se marca resuelta apenas se toca: si el usuario puede tocar
    // "Confirmar" dos veces mientras carga, reserva dos veces.
    setTarjetasResueltas((prev) => [...prev, mensajeId]);
    ultimoIntentoRef.current = { tipo: "accion", mensajeId, actionId };
    scrollAlFinal();

    try {
      const data = await ejecutarAccionAgente({
        actionId,
        estadoDemo: estadoDemoRef.current,
        usuarioId: userId,
        conversacionId: agenteConversacionIdRef.current,
      });
      await agregarRespuesta(data);
    } catch (error) {
      setMensajes((prev) => [...prev, mensajeError(error?.message)]);
    } finally {
      setEnviando(false);
      scrollAlFinal();
    }
  };

  /** Abre una conversación del historial en la pantalla de chat. */
  const handleSeleccionarConversacion = async (id) => {
    setDrawerVisible(false);
    if (!userId || id === conversacionActivaId) return;

    try {
      const conversacion = await getConversacion(userId, id);
      if (!conversacion) return;

      conversacionIdRef.current = conversacion.id;
      // Si la conversación ya tenía hilo con el agente, se retoma; si no (p. ej.
      // las de ejemplo del mock), el próximo mensaje abrirá uno nuevo.
      agenteConversacionIdRef.current = conversacion.agenteConversacionId ?? null;
      estadoDemoRef.current = undefined;
      setConversacionActivaId(conversacion.id);
      setMensajes(
        conversacion.mensajes.length ? conversacion.mensajes : [MENSAJE_BIENVENIDA]
      );
      // Las tarjetas del historial son de flujos ya terminados: sus acciones no
      // deben poder dispararse de nuevo al releer la conversación.
      setTarjetasResueltas(conversacion.mensajes.map((m) => m.id));
      setTexto("");
      scrollAlFinal();
    } catch (error) {
      // Si no se puede abrir, se queda en la conversación actual.
    }
  };

  /** Deja la pantalla lista para un chat nuevo (sin crearlo todavía). */
  const handleNuevaConversacion = () => {
    setDrawerVisible(false);
    conversacionIdRef.current = null;
    agenteConversacionIdRef.current = null;
    estadoDemoRef.current = undefined;
    ultimoIntentoRef.current = null;
    setConversacionActivaId(null);
    setMensajes([MENSAJE_BIENVENIDA]);
    setTarjetasResueltas([]);
    setTexto("");
  };

  const handleEliminarConversacion = async (id) => {
    if (!userId) return;
    try {
      await eliminarConversacion(userId, id);
      // Si borró la que estaba abierta, la pantalla vuelve a un chat en blanco.
      if (id === conversacionIdRef.current) handleNuevaConversacion();
      await cargarHistorial();
    } catch (error) {
      // Sin cambios visibles si falla.
    }
  };

  const renderMensaje = ({ item }) => {
    const esUsuario = item.rol === "usuario";
    return (
      <View style={esUsuario ? styles.filaUsuario : styles.filaAgente}>
        {/* Las tarjetas de error traen el texto adentro; ahí la burbuja sobra. */}
        {!!item.contenido && (
          <View
            style={[
              styles.burbuja,
              esUsuario ? styles.burbujaUsuario : styles.burbujaAgente,
            ]}
          >
            <Text style={esUsuario ? styles.textoUsuario : styles.textoAgente}>
              {item.contenido}
            </Text>
          </View>
        )}

        {!!item.tarjeta && (
          <TarjetaMensaje
            tarjeta={item.tarjeta}
            onAccion={(actionId) => handleAccion(item.id, actionId)}
            ocupada={enviando}
            resuelta={tarjetasResueltas.includes(item.id)}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.botonHeader}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDrawerVisible(true)}
          style={styles.botonHeader}
          accessibilityRole="button"
          accessibilityLabel="Abrir historial de conversaciones"
        >
          <Icon name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitulo}>Asistente TorreSegura</Text>
          <Text style={styles.headerSubtitulo}>Reporta incidencias del edificio</Text>
        </View>

        {/* Con el simulador activo hay que decirlo, no esconderlo. */}
        {MODO_DEMO_AGENTE ? (
          <View
            style={styles.badgeDemo}
            accessible
            accessibilityLabel="Modo demostración: las respuestas del asistente son simuladas"
          >
            <Icon name="flask-outline" size={12} color={COLORS.white} />
            <Text style={styles.badgeDemoTexto}>Demo</Text>
          </View>
        ) : (
          <Icon name="chatbubble-ellipses" size={22} color={COLORS.secondary} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.contenido}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderMensaje}
          contentContainerStyle={styles.lista}
          onContentSizeChange={scrollAlFinal}
        />

        {enviando && <BurbujaEscribiendo />}

        {/* Barra de entrada */}
        <View style={styles.barraInput}>
          <TextInput
            style={styles.input}
            placeholder="Describe el problema…"
            placeholderTextColor={COLORS.gray}
            value={texto}
            onChangeText={setTexto}
            multiline
            editable={!enviando}
          />
          <TouchableOpacity
            style={[
              styles.botonEnviar,
              (!texto.trim() || enviando) && styles.botonEnviarDeshabilitado,
            ]}
            onPress={handleEnviar}
            disabled={!texto.trim() || enviando}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
          >
            <Icon name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <HistorialDrawer
        visible={drawerVisible}
        onCerrar={() => setDrawerVisible(false)}
        conversaciones={conversaciones}
        cargando={cargandoHistorial}
        conversacionActivaId={conversacionActivaId}
        onSeleccionar={handleSeleccionarConversacion}
        onNuevaConversacion={handleNuevaConversacion}
        onEliminar={handleEliminarConversacion}
      />
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
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  botonHeader: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitulo: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "bold",
  },
  headerSubtitulo: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  badgeDemo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeDemoTexto: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 4,
  },
  contenido: {
    flex: 1,
  },
  lista: {
    padding: 16,
    paddingBottom: 8,
  },
  filaUsuario: {
    alignItems: "flex-end",
  },
  filaAgente: {
    alignItems: "flex-start",
  },
  burbuja: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  burbujaUsuario: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  burbujaAgente: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textoUsuario: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 21,
  },
  textoAgente: {
    color: COLORS.black,
    fontSize: 15,
    lineHeight: 21,
  },
  barraInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: COLORS.black,
  },
  botonEnviar: {
    marginLeft: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  botonEnviarDeshabilitado: {
    opacity: 0.5,
  },
});
