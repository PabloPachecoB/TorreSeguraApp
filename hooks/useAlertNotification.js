import { useEffect, useRef, useCallback } from "react";
import { Alert, AppState, Platform, Vibration } from "react-native";
import { Audio } from "expo-av";
import { useUserContext } from "../context/UserContext";
import { ROLES } from "../constants/roles";
import { obtenerAlertasNuevas } from "../services/alertasService";

const POLL_INTERVAL_MS = 10000; // 10 segundos

/**
 * Hook que hace polling de alertas nuevas del edificio y reproduce un sonido/vibra
 * cuando llega una alerta. Solo activo para Vigilante y Gerente.
 */
export default function useAlertNotification() {
  const { user, isAuthenticated } = useUserContext();
  const lastCheckRef = useRef(new Date().toISOString());
  const intervalRef = useRef(null);
  const soundRef = useRef(null);

  const rolesConNotificacion = [ROLES.VIGILANTE, ROLES.GERENTE, "Administrador"];
  const debePollear =
    isAuthenticated &&
    user?.role &&
    rolesConNotificacion.includes(user.role);

  const playAlertSound = useCallback(async () => {
    try {
      // Vibrar el dispositivo
      Vibration.vibrate([0, 500, 200, 500]);

      // Intentar reproducir sonido
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Generar un beep con un tono de alerta usando un URI de sonido del sistema
      // En Expo, usamos un asset embebido o generamos un tono simple
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Usar un sonido de notificacion del sistema si disponible
      // Como fallback, solo vibrar (ya lo hacemos arriba)
      if (Platform.OS !== "web") {
        const { sound } = await Audio.Sound.createAsync(
          // Usar un beep de emergencia generado como data URI
          { uri: "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" },
          { shouldPlay: true, volume: 1.0 }
        );
        soundRef.current = sound;
        // Limpiar despues de reproducir
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      }
    } catch (err) {
      // Si falla el sonido, al menos ya vibro
      console.warn("No se pudo reproducir sonido de alerta:", err.message);
    }
  }, []);

  const checkNewAlerts = useCallback(async () => {
    if (!debePollear) return;

    try {
      const nuevas = await obtenerAlertasNuevas(lastCheckRef.current);
      if (nuevas && nuevas.length > 0) {
        // Actualizar timestamp al de la alerta mas reciente
        lastCheckRef.current = nuevas[0].fecha || new Date().toISOString();

        // Sonar y vibrar
        await playAlertSound();

        // Mostrar alerta visual
        const primera = nuevas[0];
        const titulo = nuevas.length === 1
          ? `Nueva Alerta: ${primera.tipo}`
          : `${nuevas.length} Alertas Nuevas`;
        const mensaje = nuevas.length === 1
          ? primera.descripcion
          : nuevas.map((a) => `${a.tipo}: ${a.descripcion}`).join("\n");

        Alert.alert(titulo, mensaje);
      }
    } catch (err) {
      // Silenciar errores de polling
    }
  }, [debePollear, playAlertSound]);

  useEffect(() => {
    if (!debePollear) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Iniciar polling
    lastCheckRef.current = new Date().toISOString();
    intervalRef.current = setInterval(checkNewAlerts, POLL_INTERVAL_MS);

    // Pausar cuando la app va a background, reanudar en foreground
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        lastCheckRef.current = new Date().toISOString();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(checkNewAlerts, POLL_INTERVAL_MS);
        }
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription?.remove();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [debePollear, checkNewAlerts]);
}
