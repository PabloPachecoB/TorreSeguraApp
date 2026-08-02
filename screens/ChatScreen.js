// screens/ChatScreen.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Icon from "@expo/vector-icons/Ionicons";
import { COLORS, MODO_DEMO_AGENTE } from "../constants";
import {
  enviarMensajeAgente,
  enviarInteraccionAgente,
  confirmarAccionAgente,
  rechazarAccionAgente,
  obtenerAccionPendienteAgente,
  healthAgente,
  enviarAudioAgente,
} from "../services/agenteService";
import { agregarEvidenciasIncidencia } from "../services/incidenciasService";
import { prepararAudioParaQwen } from "../services/voiceAsset";
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
    "¡Hola! Soy el asistente de TorreSegura. Puedo ayudarte con incidencias, pagos, visitas, reservas y espacios de la residencia. ¿Qué necesitas?",
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

/** Evita duplicar en texto las listas que la UI ya presenta como tarjetas. */
const contenidoRespuestaReal = (data) => {
  const message = data?.message || "Recibido.";
  if (!data?.presentation) return message;
  return message.split("\n")[0].trim();
};

/** Reconstruye la confirmación cuando el request terminó después del timeout. */
const respuestaDesdeAccionPendiente = (accion, threadId) => {
  const payload = accion?.payload || {};
  const esReserva = accion?.tipo_accion === "RESERVA_CREAR";
  const detalleReserva = esReserva
    ? ` para el ${payload.date} de ${payload.start_time} a ${payload.end_time}`
    : "";
  return {
    thread_id: threadId,
    message:
      `La solicitud terminó de procesarse${detalleReserva} y está lista para confirmar.`,
    intent: esReserva ? "reservation" : "general",
    status: "awaiting_confirmation",
    requires_confirmation: true,
    action_id: accion.id,
    confirmation: {
      type: "action_confirmation",
      action_id: accion.id,
      requires_password: accion.tipo_accion === "CERRADURA_ABRIR",
    },
    presentation: null,
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
  const [evidenciasPendientes, setEvidenciasPendientes] = useState([]);
  // Modal de 2º factor para acciones de cerradura (reingreso de contraseña).
  const [passwordModal, setPasswordModal] = useState({
    visible: false,
    mensajeId: null,
    actionId: null,
  });
  const [passwordInput, setPasswordInput] = useState("");
  // Guarda la contraseña ya ingresada para el reintento inmediato de
  // ejecutarAccion (evita duplicar toda la lógica de confirmación).
  const passwordConfirmRef = useRef(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const grabando = recorderState.isRecording;
  const [procesandoVoz, setProcesandoVoz] = useState(false);

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
        contenido: contenidoRespuestaReal(data),
        tarjeta: requiereConfirmar
          ? data?.presentation || construirTarjetaResumen(data)
          : data?.presentation || undefined,
        // El action_id viaja en el mensaje: es lo que confirmará el botón.
        accionAgenteId: requiereConfirmar ? data.action_id : undefined,
        // Cerradura: el backend exige contraseña (2º factor) al confirmar. Se
        // marca aquí para que el botón abra el modal de contraseña.
        requierePassword:
          requiereConfirmar && data?.confirmation?.requires_password === true,
      });
    },
    [userId, agregarMensajeAsistente]
  );

  /**
   * Un timeout no implica que el backend haya fallado: busca una acción que
   * haya quedado pendiente antes de mostrar una tarjeta de error.
   */
  const recuperarAccionPendiente = useCallback(async () => {
    const threadId = agenteConversacionIdRef.current;
    if (!threadId) return false;
    try {
      const accion = await obtenerAccionPendienteAgente(threadId);
      if (!accion) return false;
      await agregarRespuestaReal(respuestaDesdeAccionPendiente(accion, threadId));
      return true;
    } catch {
      return false;
    }
  }, [agregarRespuestaReal]);

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
        const recuperada =
          error?.status == null ? await recuperarAccionPendiente() : false;
        if (!recuperada) {
          // Los errores no se guardan en el historial: son de esta sesión.
          setMensajes((prev) => [...prev, mensajeError(error?.message)]);
        }
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
      recuperarAccionPendiente,
    ]
  );

  /** Envía una acción de tarjeta sin reinterpretarla como texto libre. */
  const enviarInteraccion = useCallback(
    async (mensajeId, interaction) => {
      const etiqueta = interaction?.label || "Opción seleccionada";
      const hora = horaActual();
      const msgUsuario = {
        id: `u-${Date.now()}`,
        rol: "usuario",
        contenido: etiqueta,
        hora,
      };
      setMensajes((prev) => [...prev, msgUsuario]);
      setTarjetasResueltas((prev) => [...prev, mensajeId]);
      setEnviando(true);
      scrollAlFinal();

      await asegurarConversacion(hora);
      await persistirMensaje(msgUsuario);
      ultimoIntentoRef.current = {
        tipo: "interaction",
        mensajeId,
        interaction,
      };

      try {
        const data = await enviarInteraccionAgente({
          interaction: {
            type: interaction.type,
            payload: interaction.payload,
          },
          threadId: agenteConversacionIdRef.current,
        });
        await agregarRespuestaReal(data);
      } catch (error) {
        const recuperada =
          error?.status == null ? await recuperarAccionPendiente() : false;
        if (!recuperada) {
          setMensajes((prev) => [...prev, mensajeError(error?.message)]);
        }
      } finally {
        setEnviando(false);
        scrollAlFinal();
      }
    },
    [
      asegurarConversacion,
      persistirMensaje,
      agregarRespuestaReal,
      recuperarAccionPendiente,
      scrollAlFinal,
    ]
  );

  const handleEnviar = () => {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;
    setTexto("");
    enviarTexto(mensaje);
  };

  const seleccionarEvidencia = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setMensajes((prev) => [
          ...prev,
          mensajeError("Permite el acceso a tus fotos para adjuntar evidencia."),
        ]);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 3,
        quality: 0.85,
      });
      if (result?.assets?.length) {
        setEvidenciasPendientes((prev) => [...prev, ...result.assets].slice(0, 3));
      }
    } catch {
      // La evidencia es opcional; un fallo del selector no bloquea el chat.
    }
  };

  const enviarGrabacion = useCallback(
    async (audio) => {
      if (usarSimulador) {
        setMensajes((prev) => [
          ...prev,
          mensajeError("La entrada por voz necesita conexión con el agente Qwen."),
        ]);
        return;
      }
      const hora = horaActual();
      setEnviando(true);
      scrollAlFinal();
      await asegurarConversacion(hora);
      try {
        const data = await enviarAudioAgente({
          audio,
          images: evidenciasPendientes,
          threadId: agenteConversacionIdRef.current,
        });
        const transcripcion = data?.transcription?.trim();
        if (!transcripcion) throw new Error("No se reconoció ninguna frase en el audio.");
        const msgUsuario = {
          id: `u-voz-${Date.now()}`,
          rol: "usuario",
          contenido: `🎙️ ${transcripcion}`,
          hora,
        };
        setMensajes((prev) => [...prev, msgUsuario]);
        await persistirMensaje(msgUsuario);
        await agregarRespuestaReal(data);
      } catch (error) {
        setMensajes((prev) => [
          ...prev,
          mensajeError(error?.message || "No pude procesar el mensaje de voz."),
        ]);
      } finally {
        setEnviando(false);
        scrollAlFinal();
      }
    },
    [
      usarSimulador,
      asegurarConversacion,
      persistirMensaje,
      agregarRespuestaReal,
      scrollAlFinal,
      evidenciasPendientes,
    ]
  );

  const alternarGrabacion = async () => {
    if (enviando || procesandoVoz) return;
    if (grabando) {
      setProcesandoVoz(true);
      try {
        await audioRecorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
        const uri = audioRecorder.uri;
        if (!uri) throw new Error("No se pudo recuperar la grabación.");
        await enviarGrabacion(await prepararAudioParaQwen(uri));
      } catch (error) {
        setMensajes((prev) => [
          ...prev,
          mensajeError(error?.message || "No pude guardar la grabación."),
        ]);
      } finally {
        setProcesandoVoz(false);
      }
      return;
    }

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setMensajes((prev) => [
          ...prev,
          mensajeError("Permite el acceso al micrófono para enviar mensajes de voz."),
        ]);
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        mensajeError(error?.message || "No pude iniciar el micrófono."),
      ]);
    }
  };

  /** Ejecuta la acción de una tarjeta y encadena la respuesta del asistente. */
  const handleAccion = async (mensajeId, actionId) => {
    if (enviando) return;

    if (actionId && typeof actionId === "object" && actionId.type) {
      return enviarInteraccion(mensajeId, actionId);
    }

    // Reintentar no es una acción del agente: repite el último intento fallido.
    if (actionId === ACCION_REINTENTAR) {
      const intento = ultimoIntentoRef.current;
      if (!intento) return;
      if (intento.tipo === "mensaje") return enviarTexto(intento.mensaje);
      if (intento.tipo === "interaction") {
        return enviarInteraccion(intento.mensajeId, intento.interaction);
      }
      return ejecutarAccion(intento.mensajeId, intento.actionId);
    }

    return ejecutarAccion(mensajeId, actionId);
  };

  const ejecutarAccion = async (mensajeId, actionId) => {
    // Rechazar debe llegar al backend; ocultar la tarjeta localmente dejaría el
    // thread bloqueado por una acción PENDIENTE.
    if (actionId === ACCION_CANCELAR) {
      setEnviando(true);
      try {
        const msg = mensajes.find((m) => m.id === mensajeId);
        const accionAgenteId = msg?.accionAgenteId;
        if (!usarSimulador && accionAgenteId != null) {
          await rechazarAccionAgente(accionAgenteId);
        }
        setEvidenciasPendientes([]);
        setTarjetasResueltas((prev) => [...prev, mensajeId]);
        await agregarMensajeAsistente({
          contenido: "Listo, rechacé esa acción. ¿Necesitas algo más?",
        });
      } catch (error) {
        setMensajes((prev) => [...prev, mensajeError(error?.message)]);
      } finally {
        setEnviando(false);
        scrollAlFinal();
      }
      return;
    }

    // Cerradura (2º factor): si la acción exige contraseña y aún no la tenemos,
    // pedirla en el modal antes de confirmar. El backend rechaza sin ella.
    if (actionId === ACCION_CONFIRMAR && !usarSimulador) {
      const msgConf = mensajes.find((m) => m.id === mensajeId);
      if (msgConf?.requierePassword && passwordConfirmRef.current == null) {
        setPasswordInput("");
        setPasswordModal({ visible: true, mensajeId, actionId });
        return;
      }
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
          const data = await confirmarAccionAgente(
            accionAgenteId,
            passwordConfirmRef.current
          );
          const ejecutada =
            data?.estado === "EJECUTADA" || data?.resultado?.status === "success";
          if (ejecutada) {
            const conversation = data?.conversation;
            const incidentId =
              data?.resultado?.incident_id ?? data?.backend_reference;
            if (incidentId && evidenciasPendientes.length) {
              try {
                await agregarEvidenciasIncidencia(incidentId, evidenciasPendientes);
                setEvidenciasPendientes([]);
              } catch (uploadError) {
                await agregarMensajeAsistente({
                  contenido:
                    "El reporte fue creado, pero no pude adjuntar la evidencia. Puedes agregarla desde Incidencias.",
                });
              }
            }
            await agregarMensajeAsistente({
              contenido:
                conversation?.message ||
                "¡Listo! La acción se ejecutó y quedó registrada.",
              tarjeta:
                conversation?.presentation || construirTarjetaComprobante(data),
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
      // La contraseña vive solo lo que dura el intento de confirmación.
      passwordConfirmRef.current = null;
      setEnviando(false);
      scrollAlFinal();
    }
  };

  /** Confirma el modal de contraseña: guarda el 2º factor y reintenta la acción. */
  const confirmarConPassword = () => {
    const pwd = passwordInput;
    const { mensajeId, actionId } = passwordModal;
    if (!pwd) return; // el botón está deshabilitado, pero por si acaso
    passwordConfirmRef.current = pwd;
    setPasswordModal({ visible: false, mensajeId: null, actionId: null });
    setPasswordInput("");
    ejecutarAccion(mensajeId, actionId);
  };

  /** Cierra el modal de contraseña sin confirmar. */
  const cancelarPassword = () => {
    passwordConfirmRef.current = null;
    setPasswordModal({ visible: false, mensajeId: null, actionId: null });
    setPasswordInput("");
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
          <Text style={styles.headerSubtitulo}>Tu asistente para la residencia</Text>
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
        {evidenciasPendientes.length > 0 && (
          <View style={styles.evidenciasPendientes}>
            {evidenciasPendientes.map((asset) => (
              <View key={asset.uri} style={styles.evidenciaMiniaturaWrap}>
                <Image source={{ uri: asset.uri }} style={styles.evidenciaMiniatura} />
                <TouchableOpacity
                  style={styles.quitarEvidencia}
                  onPress={() =>
                    setEvidenciasPendientes((prev) =>
                      prev.filter((item) => item.uri !== asset.uri)
                    )
                  }
                >
                  <Icon name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <View style={styles.barraInput}>
          <TouchableOpacity
            style={styles.botonAdjuntar}
            onPress={seleccionarEvidencia}
            disabled={enviando || grabando || procesandoVoz}
            accessibilityLabel="Adjuntar evidencia"
          >
            <Icon name="attach" size={23} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonVoz, grabando && styles.botonVozGrabando]}
            onPress={alternarGrabacion}
            disabled={enviando || procesandoVoz}
            accessibilityRole="button"
            accessibilityLabel={grabando ? "Detener y enviar grabación" : "Grabar mensaje de voz"}
          >
            <Icon
              name={grabando ? "stop" : "mic-outline"}
              size={21}
              color={grabando ? COLORS.white : COLORS.primary}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={grabando ? "Grabando… toca detener para enviar" : "Describe el problema…"}
            placeholderTextColor={COLORS.gray}
            value={texto}
            onChangeText={setTexto}
            multiline
            editable={!enviando && !grabando}
          />
          <TouchableOpacity
            style={[
              styles.botonEnviar,
              (!texto.trim() || enviando || grabando) && styles.botonEnviarDeshabilitado,
            ]}
            onPress={handleEnviar}
            disabled={!texto.trim() || enviando || grabando}
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

      <Modal
        visible={passwordModal.visible}
        transparent
        animationType="fade"
        onRequestClose={cancelarPassword}
      >
        <View style={styles.pwOverlay}>
          <View style={styles.pwCard}>
            <Text style={styles.pwTitulo}>Confirmación reforzada</Text>
            <Text style={styles.pwTexto}>
              Por seguridad, reingresa tu contraseña para abrir la puerta.
            </Text>
            <TextInput
              style={styles.pwInput}
              placeholder="Contraseña"
              placeholderTextColor={COLORS.gray}
              secureTextEntry
              autoFocus
              value={passwordInput}
              onChangeText={setPasswordInput}
              onSubmitEditing={confirmarConPassword}
              returnKeyType="done"
            />
            <View style={styles.pwBotones}>
              <TouchableOpacity
                style={[styles.pwBoton, styles.pwCancelar]}
                onPress={cancelarPassword}
              >
                <Text style={styles.pwCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pwBoton,
                  styles.pwConfirmar,
                  !passwordInput && styles.pwBotonDeshabilitado,
                ]}
                onPress={confirmarConPassword}
                disabled={!passwordInput}
              >
                <Text style={styles.pwConfirmarTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pwOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pwCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  pwTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 6,
  },
  pwTexto: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
  },
  pwInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    marginBottom: 18,
  },
  pwBotones: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  pwBoton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pwCancelar: {
    backgroundColor: "transparent",
  },
  pwCancelarTexto: {
    color: COLORS.gray,
    fontWeight: "600",
    fontSize: 15,
  },
  pwConfirmar: {
    backgroundColor: COLORS.primary,
  },
  pwConfirmarTexto: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },
  pwBotonDeshabilitado: {
    opacity: 0.5,
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
  botonAdjuntar: {
    width: 38,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  botonVoz: {
    width: 38,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
    borderRadius: 19,
  },
  botonVozGrabando: {
    backgroundColor: COLORS.error,
  },
  evidenciasPendientes: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  evidenciaMiniaturaWrap: {
    position: "relative",
  },
  evidenciaMiniatura: {
    width: 58,
    height: 58,
    borderRadius: 8,
  },
  quitarEvidencia: {
    position: "absolute",
    top: -7,
    right: -7,
    backgroundColor: COLORS.white,
    borderRadius: 10,
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
