// services/agenteSimulador.js
//
// ─────────────────────────────────────────────────────────────────────────────
// SIMULADOR LOCAL DEL AGENTE — SOLO DEMO
//
// Genera las respuestas del asistente sin backend, para poder ver y probar los
// flujos mientras el endpoint real (POST /agente/chat/) no existe.
//
// Se activa con MODO_DEMO_AGENTE (constants/config.js). NO es un fallback: si el
// modo demo está apagado y el backend falla, el chat muestra un error, no una
// respuesta inventada.
//
// TODO: conectar endpoint real — BORRAR este archivo entero y poner
// MODO_DEMO_AGENTE en false.
// ─────────────────────────────────────────────────────────────────────────────

import { buscarArea, getDisponibilidad, confirmarReserva } from "./reservasService";
import {
  crearSolicitudVisita,
  simularLlegadaVisitante,
  responderLlegada,
} from "./visitasService";
import { MOCK_MOTIVOS } from "../data/mockVisitas";
import { COLORS } from "../constants";

/** Ids de acción genéricos que emiten las tarjetas de resumen. */
export const ACCION_CONFIRMAR = "confirmar";
export const ACCION_CANCELAR = "cancelar";
export const ACCION_VER_LLEGADA = "ver_llegada";

const DIAS = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

/** Estado inicial de la conversación simulada. */
export const estadoInicial = () => ({ flujo: null, paso: null, datos: {} });

// ─── Parsers muy simples sobre el texto del usuario ──────────────────────────
// No pretenden ser NLU: solo lo justo para que la demo responda a frases como
// las de los mockups. El agente real hará esto mucho mejor del lado del servidor.

const detectarDia = (texto) => DIAS.find((d) => texto.includes(d)) ?? null;

const detectarPersonas = (texto) => {
  const match = texto.match(/(\d+)\s*(personas?|visitantes?|invitados?)/);
  return match ? parseInt(match[1], 10) : null;
};

const detectarHorario = (texto) => {
  const horas = texto.match(/(\d{1,2}:\d{2})/g);
  if (horas && horas.length >= 2) return `${horas[0]} – ${horas[1]}`;
  return null;
};

const detectarMotivo = (texto) =>
  MOCK_MOTIVOS.find((m) => texto.includes(m.clave)) ??
  (texto.includes("entregar") || texto.includes("sofá") || texto.includes("sofa")
    ? MOCK_MOTIVOS[0]
    : null);

const detectarFlujo = (texto) => {
  if (/(reserv|piscina|salón|salon|parrilla|gimnasio|área común|area comun)/.test(texto)) {
    return "reserva";
  }
  if (/(visita|visitante|vendrán|vendran|entregar|entrega|repartidor|mudanza)/.test(texto)) {
    return "visita";
  }
  // Todo lo demás cae en incidencia: es lo que invita a hacer el mensaje de
  // bienvenida ("cuéntame qué problema encontraste").
  return "incidencia";
};

// ─── Flujo: reserva de áreas comunes (RES-04) ────────────────────────────────

async function iniciarReserva(texto) {
  const area = await buscarArea(texto);
  if (!area) {
    return {
      respuesta:
        "¿Qué área quieres reservar? Puedo ayudarte con la piscina, el salón de eventos, la parrilla o el gimnasio.",
      estado: { flujo: "reserva", paso: "pide_area", datos: {} },
    };
  }

  const dia = detectarDia(texto);
  if (!dia) {
    return {
      respuesta: `Perfecto, ${area.nombre.toLowerCase()}. ¿Para qué día lo necesitas?`,
      estado: { flujo: "reserva", paso: "pide_dia", datos: { areaId: area.id } },
    };
  }

  const personas = detectarPersonas(texto) ?? 1;
  const disponibilidad = await getDisponibilidad({ areaId: area.id, dia, personas });

  if (!disponibilidad || disponibilidad.slots.length === 0) {
    return {
      respuesta: `No encontré disponibilidad de ${area.nombre.toLowerCase()} para el ${dia}. ¿Quieres probar con otro día?`,
      estado: { flujo: "reserva", paso: "pide_dia", datos: { areaId: area.id } },
    };
  }

  const [principal, ...otros] = disponibilidad.slots;

  return {
    respuesta: "¡Buena noticia! Encontré disponibilidad para ti.",
    tarjeta: {
      tipo: "disponibilidad",
      titulo: `${area.nombre} disponible`,
      icono: area.icono,
      horarioTexto: `${capitalizar(dia)} · ${principal.horario}`,
      personas,
      reglas: area.reglas,
      horariosAlternativos: otros.map((s) => ({ id: s.id, texto: s.horario })),
    },
    estado: {
      flujo: "reserva",
      paso: "elige_slot",
      datos: { areaId: area.id, dia, personas, slotId: principal.id },
    },
  };
}

async function resumenReserva(estado, slotId) {
  const { areaId, dia, personas } = estado.datos;
  const disponibilidad = await getDisponibilidad({ areaId, dia });
  const slot = disponibilidad?.slots.find((s) => s.id === slotId);
  const area = disponibilidad?.area;

  if (!slot) {
    return {
      respuesta: "Ese horario ya no figura como disponible.",
      tarjeta: {
        tipo: "error",
        mensaje: "El horario que elegiste ya no está disponible. Probemos de nuevo.",
      },
      estado: { flujo: "reserva", paso: "elige_slot", datos: estado.datos },
    };
  }

  return {
    respuesta: "Revisa los datos y confirma para registrar la reserva.",
    tarjeta: {
      tipo: "resumen",
      titulo: "Resumen de la reserva",
      icono: "calendar",
      campos: [
        { etiqueta: "Área", valor: area.nombre, icono: area.icono },
        { etiqueta: "Fecha", valor: disponibilidad.fecha, icono: "calendar-outline" },
        { etiqueta: "Horario", valor: slot.horario, icono: "time-outline" },
        { etiqueta: "Personas", valor: String(personas), icono: "people-outline" },
      ],
      nota: "El área queda sujeta a las reglas de convivencia del condominio.",
      acciones: [
        { id: ACCION_CONFIRMAR, texto: "Confirmar", variante: "primario" },
        { id: ACCION_CANCELAR, texto: "Cancelar", variante: "secundario" },
      ],
    },
    estado: { flujo: "reserva", paso: "confirma", datos: { ...estado.datos, slotId } },
  };
}

async function confirmarReservaFlujo(estado) {
  const { slotId, personas } = estado.datos;
  // Si confirmarReserva lanza, el error sube a ChatScreen y se muestra la
  // tarjeta de error. No se fabrica un comprobante.
  const reserva = await confirmarReserva({ slotId, personas });

  return {
    respuesta: "Reserva confirmada. Te dejo el comprobante.",
    tarjeta: {
      tipo: "comprobante",
      titulo: "Comprobante de reserva",
      icono: "checkmark-circle",
      encabezadoExito: "Reserva confirmada",
      estado: { texto: reserva.estado, color: COLORS.success },
      campos: [
        { etiqueta: "Fecha", valor: reserva.fecha, icono: "calendar-outline" },
        { etiqueta: "Horario", valor: reserva.horario, icono: "time-outline" },
        { etiqueta: "Área", valor: reserva.area, icono: reserva.areaIcono },
        { etiqueta: "Personas", valor: String(reserva.personas), icono: "people-outline" },
      ],
      codigo: { etiqueta: "Código de reserva", valor: reserva.codigo },
    },
    estado: estadoInicial(),
  };
}

// ─── Flujo: autorización de visitantes (VIS-01 · simulación) ─────────────────

async function iniciarVisita(texto, datos = {}) {
  const visitantes = detectarPersonas(texto) ?? datos.visitantes ?? 1;
  const horario = detectarHorario(texto) ?? datos.horario;
  const motivo = detectarMotivo(texto) ?? datos.motivo;

  if (!horario) {
    return {
      respuesta:
        "¿En qué horario llegarían? Por ejemplo: \"entre 10:00 y 12:00\".",
      estado: {
        flujo: "visita",
        paso: "pide_horario",
        datos: { visitantes, motivo },
      },
    };
  }

  const etiquetaMotivo = motivo?.etiqueta ?? "Visita";

  return {
    respuesta: "He creado la solicitud de autorización. Revísala y confírmala para registrarla.",
    tarjeta: {
      tipo: "resumen",
      titulo: "Solicitud de autorización",
      icono: "person-add",
      esSimulacion: true,
      campos: [
        { etiqueta: "Fecha", valor: "24 de mayo de 2025", icono: "calendar-outline" },
        { etiqueta: "Horario", valor: horario, icono: "time-outline" },
        { etiqueta: "Apartamento", valor: "4B", icono: "business-outline" },
        { etiqueta: "Motivo", valor: etiquetaMotivo, icono: motivo?.icono ?? "pricetag-outline" },
        { etiqueta: "Visitantes", valor: String(visitantes), icono: "people-outline" },
      ],
      nota: "La foto de referencia no se usa para reconocimiento facial.",
      acciones: [
        { id: ACCION_CONFIRMAR, texto: "Confirmar solicitud", variante: "primario" },
        { id: ACCION_CANCELAR, texto: "Cancelar", variante: "secundario" },
      ],
    },
    estado: {
      flujo: "visita",
      paso: "confirma",
      datos: { visitantes, horario, motivo, etiquetaMotivo },
    },
  };
}

async function confirmarVisita(estado, usuarioId) {
  const { visitantes, horario, motivo, etiquetaMotivo } = estado.datos;

  const visita = await crearSolicitudVisita({
    usuarioId,
    apartamento: "4B",
    motivo: etiquetaMotivo,
    motivoClave: motivo?.clave,
    fecha: "24 de mayo de 2025",
    horario,
    visitantes,
  });

  return {
    respuesta: "¡Listo! Tu visita ha sido registrada. Este es el pase temporal del visitante.",
    tarjeta: {
      tipo: "pase",
      titulo: "Pase temporal para el visitante",
      esSimulacion: true,
      codigoQR: visita.codigoQR,
      validoHasta: visita.validoHasta,
      campos: [
        { etiqueta: "Motivo", valor: visita.motivo, icono: "pricetag-outline" },
        { etiqueta: "Fecha", valor: visita.fecha, icono: "calendar-outline" },
        { etiqueta: "Horario", valor: visita.horario, icono: "time-outline" },
        { etiqueta: "Visitantes", valor: String(visita.visitantes), icono: "people-outline" },
      ],
      acciones: [
        { id: ACCION_VER_LLEGADA, texto: "Simular llegada del visitante", variante: "secundario" },
      ],
    },
    estado: { flujo: "visita", paso: "espera_llegada", datos: { visitaId: visita.id, ...estado.datos } },
  };
}

async function llegadaVisita(estado) {
  const visita = await simularLlegadaVisitante(estado.datos.visitaId);
  if (!visita) {
    return {
      respuesta: "No encontré esa visita.",
      tarjeta: { tipo: "error", mensaje: "No encontré la visita que intentas abrir." },
      estado: estadoInicial(),
    };
  }

  return {
    respuesta: "El visitante llegó a la puerta.",
    tarjeta: {
      tipo: "llegada",
      titulo: "Los repartidores llegaron",
      subtitulo: visita.motivo,
      cuando: "Ahora",
      visitantes: visita.visitantes,
      esSimulacion: true,
    },
    estado: { flujo: "visita", paso: "decide_llegada", datos: estado.datos },
  };
}

async function decidirLlegada(estado, decision) {
  const visita = await responderLlegada(estado.datos.visitaId, decision);
  const permitido = decision === "permitir";

  return {
    respuesta: permitido
      ? "Ingreso permitido. Aviso a portería."
      : "Ingreso rechazado. Aviso a portería.",
    tarjeta: {
      tipo: "comprobante",
      titulo: permitido ? "Ingreso autorizado" : "Ingreso rechazado",
      icono: permitido ? "checkmark-circle" : "close-circle",
      esSimulacion: true,
      encabezadoExito: permitido ? "Ingreso permitido" : "Ingreso rechazado",
      estado: {
        texto: permitido ? "Autorizada" : "Rechazada",
        color: permitido ? COLORS.success : COLORS.error,
      },
      campos: [
        { etiqueta: "Motivo", valor: visita?.motivo ?? "Visita", icono: "pricetag-outline" },
        { etiqueta: "Apartamento", valor: visita?.apartamento ?? "4B", icono: "business-outline" },
        { etiqueta: "Visitantes", valor: String(visita?.visitantes ?? 1), icono: "people-outline" },
      ],
    },
    estado: estadoInicial(),
  };
}

// ─── Flujo: incidencia (básico, para que el mensaje de bienvenida tenga sentido) ──

function resumenIncidencia(texto) {
  return {
    respuesta: "He evaluado la información y esta es la propuesta inicial del reporte.",
    tarjeta: {
      tipo: "resumen",
      titulo: "Evaluación inicial",
      icono: "clipboard-outline",
      campos: [
        { etiqueta: "Categoría", valor: categoriaIncidencia(texto), icono: "pricetag-outline" },
        {
          etiqueta: "Prioridad",
          valor: "Media",
          icono: "flag-outline",
          colorValor: COLORS.accent,
          puntoColor: true,
        },
        { etiqueta: "Estimado", valor: "$100–$150", icono: "cash-outline" },
        { etiqueta: "Tiempo", valor: "1–2 días", icono: "time-outline" },
      ],
      nota: "Sujeto a revisión por el administrador y el técnico asignado.",
      acciones: [
        { id: ACCION_CONFIRMAR, texto: "Crear reporte", variante: "primario" },
        { id: ACCION_CANCELAR, texto: "Cancelar", variante: "secundario" },
      ],
    },
    estado: { flujo: "incidencia", paso: "confirma", datos: { texto } },
  };
}

function categoriaIncidencia(texto) {
  if (/(ventana|vidrio)/.test(texto)) return "Ventana";
  if (/(agua|fuga|caño|cano|tubería|tuberia)/.test(texto)) return "Plomería";
  if (/(luz|foco|eléctric|electric)/.test(texto)) return "Electricidad";
  if (/(ascensor|elevador)/.test(texto)) return "Ascensor";
  if (/(puerta|cerradura)/.test(texto)) return "Cerradura";
  return "General";
}

function comprobanteIncidencia() {
  const numero = Math.floor(500 + Math.random() * 400);
  return {
    respuesta: "¡Listo! La orden de trabajo fue creada y está en proceso.",
    tarjeta: {
      tipo: "comprobante",
      titulo: "Orden de trabajo",
      icono: "construct",
      encabezadoExito: "Orden creada",
      estado: { texto: "Aprobada", color: COLORS.success },
      campos: [
        { etiqueta: "Técnico", valor: "Carlos Ramírez", icono: "person-outline" },
        { etiqueta: "Programado", valor: "23 may, 09:00 – 11:00", icono: "calendar-outline" },
      ],
      codigo: { etiqueta: "ID de orden", valor: `OT-2024-0${numero}` },
    },
    estado: estadoInicial(),
  };
}

const capitalizar = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

// ─── API del simulador ───────────────────────────────────────────────────────

/**
 * Responde a un mensaje del usuario.
 *
 * @param {object} params
 * @param {string} params.mensaje
 * @param {object} params.estado - El estado devuelto en la llamada anterior.
 * @returns {Promise<{respuesta: string, tarjeta?: Tarjeta, estado: object}>}
 */
export async function responderMensaje({ mensaje, estado = estadoInicial() } = {}) {
  const texto = (mensaje || "").toLowerCase();

  // Continuación de un flujo a medias (faltaba un dato).
  if (estado.flujo === "reserva" && ["pide_area", "pide_dia"].includes(estado.paso)) {
    const contexto = estado.datos.areaId ? `${estado.datos.areaId} ${texto}` : texto;
    return iniciarReserva(contexto);
  }
  if (estado.flujo === "visita" && estado.paso === "pide_horario") {
    return iniciarVisita(texto, estado.datos);
  }

  const flujo = detectarFlujo(texto);
  if (flujo === "reserva") return iniciarReserva(texto);
  if (flujo === "visita") return iniciarVisita(texto);
  return resumenIncidencia(texto);
}

/**
 * Responde a la acción de una tarjeta (Confirmar, Cancelar, elegir horario…).
 *
 * @param {object} params
 * @param {string} params.actionId
 * @param {object} params.estado
 * @param {string} [params.usuarioId]
 * @returns {Promise<{respuesta: string, tarjeta?: Tarjeta, estado: object}>}
 */
export async function responderAccion({ actionId, estado = estadoInicial(), usuarioId } = {}) {
  // Los horarios alternativos vienen como "elegir_horario:<slotId>".
  if (actionId.startsWith("elegir_horario:")) {
    return resumenReserva(estado, actionId.split(":")[1]);
  }

  if (actionId === "reservar_slot") {
    return resumenReserva(estado, estado.datos.slotId);
  }

  if (actionId === ACCION_CANCELAR) {
    return {
      respuesta: "Listo, cancelé esa solicitud. ¿Necesitas algo más?",
      estado: estadoInicial(),
    };
  }

  if (actionId === ACCION_VER_LLEGADA) {
    return llegadaVisita(estado);
  }

  if (actionId === "permitir_ingreso") return decidirLlegada(estado, "permitir");
  if (actionId === "rechazar_ingreso") return decidirLlegada(estado, "rechazar");

  if (actionId === ACCION_CONFIRMAR) {
    if (estado.flujo === "reserva") return confirmarReservaFlujo(estado);
    if (estado.flujo === "visita") return confirmarVisita(estado, usuarioId);
    if (estado.flujo === "incidencia") return comprobanteIncidencia();
  }

  return {
    respuesta: "No pude procesar esa acción.",
    estado: estadoInicial(),
  };
}
