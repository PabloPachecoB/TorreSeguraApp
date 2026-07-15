// screens/ChatScreen.js
import React, { useState, useRef, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "@expo/vector-icons/Ionicons";
import { COLORS } from "../constants";
import { enviarMensajeAgente } from "../services/agenteService";

const MENSAJE_BIENVENIDA = {
  id: "bienvenida",
  autor: "agente",
  texto:
    "¡Hola! Soy el asistente de TorreSegura. Cuéntame qué problema encontraste en el edificio (por ejemplo: \"hay una fuga de agua en el pasillo del piso 3\") y me encargo de gestionarlo.",
};

export default function ChatScreen({ navigation }) {
  const [mensajes, setMensajes] = useState([MENSAJE_BIENVENIDA]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const conversacionIdRef = useRef(null);
  const listRef = useRef(null);

  const scrollAlFinal = useCallback(() => {
    // Pequeño delay para que el FlatList ya tenga el mensaje nuevo
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleEnviar = async () => {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;

    const msgUsuario = { id: `u-${Date.now()}`, autor: "usuario", texto: mensaje };
    setMensajes((prev) => [...prev, msgUsuario]);
    setTexto("");
    setEnviando(true);
    scrollAlFinal();

    try {
      const data = await enviarMensajeAgente({
        mensaje,
        conversacionId: conversacionIdRef.current,
      });
      if (data?.conversacion_id) conversacionIdRef.current = data.conversacion_id;
      setMensajes((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          autor: "agente",
          texto: data?.respuesta || "Recibido. Estoy procesando tu solicitud.",
        },
      ]);
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          autor: "agente",
          texto:
            "No pude conectar con el asistente en este momento. Verifica tu conexión e intenta de nuevo, o reporta el problema desde el módulo de Alertas.",
          esError: true,
        },
      ]);
    } finally {
      setEnviando(false);
      scrollAlFinal();
    }
  };

  const renderMensaje = ({ item }) => {
    const esUsuario = item.autor === "usuario";
    return (
      <View
        style={[
          styles.burbuja,
          esUsuario ? styles.burbujaUsuario : styles.burbujaAgente,
          item.esError && styles.burbujaError,
        ]}
      >
        <Text style={esUsuario ? styles.textoUsuario : styles.textoAgente}>
          {item.texto}
        </Text>
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
          style={styles.botonAtras}
          accessibilityLabel="Volver"
        >
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitulo}>Asistente TorreSegura</Text>
          <Text style={styles.headerSubtitulo}>Reporta incidencias del edificio</Text>
        </View>
        <Icon name="chatbubble-ellipses" size={22} color={COLORS.secondary} />
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

        {enviando && (
          <View style={styles.escribiendo}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.escribiendoTexto}>El asistente está pensando…</Text>
          </View>
        )}

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
            accessibilityLabel="Enviar mensaje"
          >
            <Icon name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  botonAtras: {
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
  contenido: {
    flex: 1,
  },
  lista: {
    padding: 16,
    paddingBottom: 8,
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
  burbujaError: {
    borderColor: COLORS.error,
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
  escribiendo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  escribiendoTexto: {
    marginLeft: 8,
    color: COLORS.gray,
    fontSize: 13,
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
