// constants/config.js

/**
 * Modo demo del Asistente.
 *
 * true  → las respuestas del agente las genera un simulador local
 *         (services/agenteSimulador.js) con datos mock. El chat muestra un badge
 *         "Demo" para que nadie confunda esto con el agente real.
 * false → se usa el endpoint real (POST /agente/chat/, ver agenteService.js).
 *         Si falla, se muestra la tarjeta de error. NUNCA un éxito simulado.
 *
 * Existe porque el backend del agente todavía no está. Es un interruptor
 * explícito, no un fallback: el chat no cae en simulación cuando el backend
 * falla. Esa confusión entre "simulado" y "real" es justamente el hallazgo
 * crítico #5 de ESTADO_ACTUAL_PROYECTO.md.
 *
 * TODO: conectar endpoint real — poner en false y borrar services/agenteSimulador.js.
 */
export const MODO_DEMO_AGENTE = true;
