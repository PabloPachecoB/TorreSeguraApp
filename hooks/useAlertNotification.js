import { useEffect, useRef } from "react";
import { Alert, Platform, Vibration } from "react-native";
import { Audio } from "expo-av";
import { useUserContext } from "../context/UserContext";
import { obtenerAlertasNuevas } from "../services/alertasService";

const POLL_INTERVAL = 10000; // 10 segundos

export default function useAlertNotification() {
  const { user, isAuthenticated } = useUserContext();
  const lastPoll = useRef(new Date().toISOString());
  const intervalRef = useRef(null);

  const rolNombre = user?.role || user?.rol?.nombre;
  const shouldPoll =
    isAuthenticated && (rolNombre === "Vigilante" || rolNombre === "Gerente");

  useEffect(() => {
    if (!shouldPoll) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Reset timestamp al activarse
    lastPoll.current = new Date().toISOString();

    async function poll() {
      try {
        const nuevas = await obtenerAlertasNuevas(lastPoll.current);
        if (nuevas && nuevas.length > 0) {
          lastPoll.current = new Date().toISOString();

          // Vibrar
          Vibration.vibrate([0, 300, 150, 300]);

          // Sonido
          try {
            const { sound } = await Audio.Sound.createAsync(
              require("../assets/alert_beep.mp3")
            );
            await sound.playAsync();
            // Liberar después de reproducir
            sound.setOnPlaybackStatusUpdate((s) => {
              if (s.didJustFinish) sound.unloadAsync();
            });
          } catch {
            // Si no hay archivo de sonido, seguir sin error
          }

          // Mostrar alerta nativa
          const count = nuevas.length;
          const tipos = [...new Set(nuevas.map((a) => a.tipo))].join(", ");
          Alert.alert(
            `🔔 ${count} nueva${count > 1 ? "s" : ""} alerta${count > 1 ? "s" : ""}`,
            `Tipo${count > 1 ? "s" : ""}: ${tipos}`,
            [{ text: "OK" }]
          );
        }
      } catch {
        // Silenciar errores de polling
      }
    }

    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [shouldPoll]);
}
