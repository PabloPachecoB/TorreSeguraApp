// constants/config.js

import { API_BASE } from "@env";

/**
 * URL base del backend.
 *
 * La fuente de verdad es el archivo .env (`API_BASE`), que ya consume el axios
 * centralizado de services/apiClient.js (con su interceptor de Bearer/refresh).
 * Se re-exporta aquí como `API_BASE_URL` para dejarla descubrible desde
 * constants/ y fácil de rastrear; NO es una segunda fuente que haya que mantener
 * sincronizada: cambiarla se hace editando .env, no aquí.
 *
 * Ojo: apiClient construye su baseURL como `${API_BASE}/api/v1`. Esta constante
 * expone la raíz sin ese sufijo, por si algún día se necesita el host pelado.
 */
export const API_BASE_URL = API_BASE;

/**
 * Modo demo del Asistente — interruptor MANUAL para forzar el simulador.
 *
 * El agente real (Huáscar) ya está conectado (ver services/agenteService.js), así
 * que el valor por defecto es `false`: el chat usa los endpoints reales.
 *
 * true  → fuerza el simulador local (services/agenteSimulador.js) siempre, con un
 *         badge "Demo" visible. Útil para desarrollar sin backend.
 * false → chat real. Si el `health` del agente devuelve caído, ChatScreen cae al
 *         simulador COMO FALLBACK EXPLÍCITO, con un badge "Sin conexión" visible
 *         (nunca un éxito silencioso). Si una llamada real falla en medio de la
 *         conversación, se muestra la tarjeta de error — no se simula.
 *
 * Nota: el fallback por `health` NO reconstruye el hallazgo crítico #5
 * (éxito simulado ante error), porque siempre se avisa con el badge y un fallo
 * en vivo del chat/confirmar se muestra como error, no como éxito.
 */
export const MODO_DEMO_AGENTE = false;
