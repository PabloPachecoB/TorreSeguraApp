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
import {
  enviarMensajeAgente,
  confirmarAccionAgente,
  healthAgente,
} from "../services/agenteService";
// El simulador se usa SOLO como fallback explícito (health caído o demo manual).
import { responderMensaje, responderAccion } from "../services/agenteSimulador";
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

/** Ids de acción de la tarjeta de resumen. Confirmar es la ÚNICA vía de ejecutar. */
const ACCION_CONFIRMAR = "confirmar";
const ACCION_CANCELAR = "cancelar";

/** Mensaje de error con tarjeta de reintento. Nunca finge que la acción salió bien. */
const mensajeError = (detalle, opts = {}) => ({
  id: `e-${Date.now()}`,
  rol: "asistente",
  contenido: "",
  hora: horaActual(),
  esError: true,
  tarjeta: {
    tipo: "error",
    mensaje:
      opts.mensaje ||
      "No pude completar la acción. Verifica tu conexión e intenta de nuevo, o reporta el problema desde el módulo de Alertas.",
    detalle,
    permiteReintentar: opts.permiteReintentar,
  },
});

/**
 * Sintetiza una TarjetaResumen desde la respuesta del agente que pide
 * confirmación. El resumen textual ya va en la burbuja (`message`); la tarjeta
 * queda limpia: título por `intent`, aviso de vencimiento y botones.
 */
const construirTarjetaResumen = (data) => {
  const intent = (data?.intent || "").toLowerCase();
  const meta = intent.includes("reserv")
    ? { titulo: "Confirmar reserva", icono: "calendar" }
    : intent.includes("incid")
    ? { titulo: "Confirmar incidencia", icono: "construct" }
    : { titulo: "Confirmar acción", icono: "help-circle-outline" };

  const seg = data?.confirmation?.expires_in_seconds;
  const mins = seg ? Math.max(1, Math.round(seg / 60)) : null;

  return {
    tipo: "resumen",
    titulo: meta.titulo,
    icono: meta.icono,
    // Sin campos: el detalle vive en la burbuja para no duplicar el texto.
    campos: [],
    nota: mins
      ? `Esta confirmación vence en ~${mins} min. Toca Confirmar para ejecutarla.`
      : "Toca Confirmar para ejecutar esta acción.",
    acciones: [
      { id: ACCION_CONFIRMAR, texto: "Confirmar", variante: "primario", icono: "checkmark" },
      { id: ACCION_CANCELAR, texto: "Cancelar", variante: "secundario" },
    ],
  };
};

/** Comprobante desde la respuesta de confirmar/ (id y estado REALES del backend). */
const construirTarjetaComprobante = (data) => {
  const estadoTexto =
    data?.resultado?.reservation_status ||
    data?.resultado?.incident_status ||
    (data?.estado ? "Ejecutada" : null);
  // El identificador real puede venir como backend_reference (string) o dentro
  // de resultado (reservation_id / incident_id). Se toma el primero que llegue.
  const ref =
    data?.backend_reference ??
    data?.resultado?.reservation_id ??
    data?.resultado?.incident_id;

  return {
    tipo: "comprobante",
    titulo: "Comprobante",
    icono: "checkmark-circle",
    encabezadoExito:
      data?.verification_status === "VERIFICADA" ? "Confirmada y verificada" : "Confirmada",
    estado: estadoTexto ? { texto: estadoTexto, color: COLORS.success } : undefined,
    campos: [],
    // Prioriza el id real; si no llegara ninguno, cae al estado como referencia
    // clara en vez de dejar el comprobante sin dato (nunca un guion suelto).
    codigo:
      ref != null
        ? { etiqueta: "Referencia", valor: `#${ref}` }
        : estadoTexto
        ? { etiqueta: "Estado", valor: estadoTexto }
        : undefined,
  };
};

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

  // Disponibilidad del agente real. null = comprobando. Cuando está caído (false)
  // el chat cae al simulador como FALLBACK EXPLÍCITO (badge visible), nunca en
  // silencio. MODO_DEMO_AGENTE lo fuerza manualmente.
  const [agenteDisponible, setAgenteDisponible] = useState(null);
  const usarSimulador = MODO_DEMO_AGENTE || agenteDisponible === false;

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

  // Chequeo de salud del agente al montar: decide real vs. fallback simulado.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const salud = await healthAgente();
        const ok = salud?.healthy === true || salud?.status === "ok";
        if (vivo) setAgenteDisponible(ok);
      } catch {
        // Sin health no arriesgamos el chat real: fallback explícito al simulador.
        if (vivo) setAgenteDisponible(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

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

  /** Agrega un mensaje del asistente (texto + tarjeta opcional) y lo persiste. */
  const agregarMensajeAsistente = useCallback(
    async (parcial) => {
      const msgAgente = {
        id: `a-${Date.now()}`,
        rol: "asistente",
        contenido: "",
        hora: horaActual(),
        ...parcial,
      };
      setMensajes((prev) => [...prev, msgAgente]);
      await persistirMensaje(msgAgente);
      return msgAgente;
    },
    [persistirMensaje]
  );

  /** Mapea la respuesta del SIMULADOR (shape { respuesta, tarjeta, estado }). */
  const agregarRespuestaSimulador = useCallback(
    async (data) => {
      estadoDemoRef.current = data?.estado;

      if (data?.conversacion_id) {
        agenteConversacionIdRef.current = data.conversacion_id;
        if (userId && conversacionIdRef.current) {
          await guardarIdAgente(userId, conversacionIdRef.current, data.conversacion_id);
        }
      }

      await agregarMensajeAsistente({
        contenido: data?.respuesta || "Recibido. Estoy procesando tu solicitud.",
        tarjeta: data?.tarjeta,
      });
    },
    [userId, agregarMensajeAsistente]
  );

  /** Mapea la respuesta del AGENTE REAL (shape { thread_id, message, ... }). */
  const agregarRespuestaReal = useCallback(
    async (data) => {
      // Conserva el hilo del agente entre turnos (memoria de la conversación).
      if (data?.thread_id) {
        agenteConversacionIdRef.current = data.thread_id;
        if (userId && conversacionIdRef.current) {
          await guardarIdAgente(userId, conversacionIdRef.current, data.thread_id);
        }
      }

      const requiereConfirmar =
        data?.requires_confirmation === true && data?.action_id != null;

      await agregarMensajeAsistente({
        contenido: data?.message || "Recibido.",
        tarjeta: requiereConfirmar ? construirTarjetaResumen(data) : undefined,
        // El action_id viaja en el mensaje: es lo que confirmará el botón.
        accionAgenteId: requiereConfirmar ? data.action_id : undefined,
      });
    },
    [userId, agregarMensajeAsistente]
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
        if (usarSimulador) {
          const data = await responderMensaje({ mensaje, estado: estadoDemoRef.current });
          await agregarRespuestaSimulador(data);
        } else {
          // "sí, confirma" es solo otro mensaje: el agente decide, la app NO
          // confirma por texto. La confirmación real es el botón de la tarjeta.
          const data = await enviarMensajeAgente({
            message: mensaje,
            threadId: agenteConversacionIdRef.current,
          });
          await agregarRespuestaReal(data);
        }
      } catch (error) {
        // Los errores no se guardan en el historial: son de esta sesión.
        setMensajes((prev) => [...prev, mensajeError(error?.message)]);
      } finally {
        setEnviando(false);
        scrollAlFinal();
      }
    },
    [
      asegurarConversacion,
      persistirMensaje,
      agregarRespuestaSimulador,
      agregarRespuestaReal,
      usarSimulador,
      scrollAlFinal,
    ]
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
    // Cancelar es local: no hay endpoint de rechazo y no debe tocar el backend.
    // Solo cierra la tarjeta para que no se pueda confirmar después.
    if (actionId === ACCION_CANCELAR) {
      setTarjetasResueltas((prev) => [...prev, mensajeId]);
      await agregarMensajeAsistente({
        contenido: "Listo, cancelé esa acción. ¿Necesitas algo más?",
      });
      scrollAlFinal();
      return;
    }

    setEnviando(true);
    // La tarjeta se marca resuelta apenas se toca: si el usuario puede tocar
    // "Confirmar" dos veces mientras carga, confirma dos veces.
    setTarjetasResueltas((prev) => [...prev, mensajeId]);
    ultimoIntentoRef.current = { tipo: "accion", mensajeId, actionId };
    scrollAlFinal();

    try {
      if (usarSimulador) {
        const data = await responderAccion({
          actionId,
          estado: estadoDemoRef.current,
          usuarioId: userId,
        });
        await agregarRespuestaSimulador(data);
      } else if (actionId === ACCION_CONFIRMAR) {
        // ÚNICA vía de confirmar: el botón → endpoint dedicado con el action_id.
        const msg = mensajes.find((m) => m.id === mensajeId);
        const accionAgenteId = msg?.accionAgenteId;
        if (accionAgenteId == null) {
          throw new Error("No encontré la acción a confirmar. Vuelve a pedir la reserva.");
        }
        try {
          const data = await confirmarAccionAgente(accionAgenteId);
          const ejecutada =
            data?.estado === "EJECUTADA" || data?.resultado?.status === "success";
          if (ejecutada) {
            await agregarMensajeAsistente({
              contenido: "¡Listo! La acción se ejecutó y quedó registrada.",
              tarjeta: construirTarjetaComprobante(data),
            });
          } else {
            // 200 pero no ejecutada (rechazada/vencida): error, nunca comprobante.
            setMensajes((prev) => [
              ...prev,
              mensajeError(null, {
                mensaje:
                  data?.mensaje ||
                  "La acción no se pudo ejecutar. Vuelve a pedirla e inténtalo de nuevo.",
                permiteReintentar: false,
              }),
            ]);
          }
        } catch (err) {
          // Vencimiento / acción ya no válida: mensaje claro, sin reintento inútil.
          if ([400, 404, 409, 410].includes(err?.status)) {
            setMensajes((prev) => [
              ...prev,
              mensajeError(err?.message, {
                mensaje:
                  "La confirmación venció o ya no es válida. Vuelve a pedir la acción al asistente.",
                permiteReintentar: false,
              }),
            ]);
          } else {
            throw err; // otros errores → tarjeta de error genérica (con reintento).
          }
        }
      }
      // En modo real no hay otras acciones que el agente dispare.
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

        {/* Con el simulador activo hay que decirlo, no esconderlo. El fallback
            por agente caído se marca distinto ("Sin conexión") para que se
            entienda que no es el asistente real. */}
        {usarSimulador ? (
          <View
            style={styles.badgeDemo}
            accessible
            accessibilityLabel={
              agenteDisponible === false
                ? "Asistente no disponible: respuestas simuladas de respaldo"
                : "Modo demostración: las respuestas del asistente son simuladas"
            }
          >
            <Icon
              name={agenteDisponible === false ? "cloud-offline-outline" : "flask-outline"}
              size={12}
              color={COLORS.white}
            />
            <Text style={styles.badgeDemoTexto}>
              {agenteDisponible === false ? "Sin conexión" : "Demo"}
            </Text>
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
