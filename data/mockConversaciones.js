// data/mockConversaciones.js
//
// TODO: conectar endpoint real — este archivo desaparece cuando el backend
// exponga el historial. Solo lo consume services/conversacionesService.js;
// ningún componente de UI debe importarlo directamente.
//
// Modelo de una conversación (imita la forma esperada del endpoint):
//   id            string
//   usuarioId     string   dueño de la conversación (aísla el historial por cuenta)
//   titulo        string   resumen corto, se muestra en el drawer
//   modulo        "reserva" | "incidencia" | "visita" | "cerradura"
//   creadaEn      string   ISO 8601
//   actualizadaEn string   ISO 8601 — criterio de orden del listado
//   ultimoMensaje string   preview de la última línea
//   mensajes      Mensaje[]
//
// Modelo de un mensaje:
//   id         string
//   rol        "usuario" | "asistente"
//   contenido  string
//   hora       string   "09:41" — formato ya listo para mostrar
//   tarjeta    objeto opcional — contrato en CONEXION_BACKEND.md; el `tipo` lo
//              resuelve components/agente/TarjetaMensaje.js
//   adjunto    objeto opcional ({ tipo, uri })

import { COLORS } from "../constants/colors";

/** Devuelve un ISO desplazado N minutos hacia el pasado desde ahora. */
const haceMinutos = (minutos) =>
  new Date(Date.now() - minutos * 60 * 1000).toISOString();

const MINUTOS_POR_HORA = 60;
const MINUTOS_POR_DIA = 24 * MINUTOS_POR_HORA;

// El usuario "carlos" es la cuenta de demo (ver utils/users.js → propietario1).
// Las fechas se calculan al cargar el módulo para que las fechas relativas
// ("hace 2 h", "ayer") sigan teniendo sentido sin importar cuándo se abra la app.
export const MOCK_CONVERSACIONES = [
  {
    id: "conv-incidencia-ventana",
    usuarioId: "carlos",
    titulo: "Ventana rota en la sala",
    modulo: "incidencia",
    creadaEn: haceMinutos(2 * MINUTOS_POR_HORA + 20),
    actualizadaEn: haceMinutos(2 * MINUTOS_POR_HORA),
    ultimoMensaje: "La orden de trabajo OT-2024-0587 fue aprobada y está en proceso.",
    mensajes: [
      {
        id: "m1",
        rol: "asistente",
        contenido:
          "¡Hola! Soy el asistente de TorreSegura. Cuéntame qué problema encontraste en el edificio y me encargo de gestionarlo.",
        hora: "09:41",
      },
      {
        id: "m2",
        rol: "usuario",
        contenido: "La ventana de la sala está rota.",
        hora: "09:41",
      },
      {
        id: "m3",
        rol: "asistente",
        contenido: "Gracias por el reporte. ¿Podrías adjuntar una foto como evidencia?",
        hora: "09:41",
      },
      {
        id: "m4",
        rol: "usuario",
        contenido: "Listo, ahí va la foto.",
        hora: "09:42",
        adjunto: { tipo: "imagen", uri: null },
      },
      {
        id: "m5",
        rol: "asistente",
        contenido:
          "He evaluado la información. Categoría: Ventana · Prioridad: Media · Estimado: $100–$150 · Tiempo: 1–2 días. Sujeto a revisión del administrador y el técnico asignado.",
        hora: "09:42",
        tarjeta: {
          tipo: "resumen",
          titulo: "Evaluación inicial",
          icono: "clipboard-outline",
          campos: [
            { etiqueta: "Categoría", valor: "Ventana", icono: "pricetag-outline" },
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
            { id: "confirmar", texto: "Crear reporte", variante: "primario" },
            { id: "cancelar", texto: "Cancelar", variante: "secundario" },
          ],
        },
      },
      {
        id: "m6",
        rol: "usuario",
        contenido: "Sí, crea el reporte con esa evaluación.",
        hora: "09:43",
      },
      {
        id: "m7",
        rol: "asistente",
        contenido:
          "¡Listo! La orden de trabajo OT-2024-0587 fue aprobada y está en proceso. Técnico asignado: Carlos Ramírez, programado para el 23 de mayo, 09:00–11:00.",
        hora: "10:12",
        tarjeta: {
          tipo: "comprobante",
          titulo: "Orden de trabajo",
          icono: "construct",
          encabezadoExito: "Orden aprobada",
          estado: { texto: "Aprobada", color: COLORS.success },
          campos: [
            { etiqueta: "Categoría", valor: "Ventana", icono: "pricetag-outline" },
            { etiqueta: "Técnico", valor: "Carlos Ramírez", icono: "person-outline" },
            {
              etiqueta: "Programado",
              valor: "23 may 2024, 09:00 – 11:00",
              icono: "calendar-outline",
            },
          ],
          codigo: { etiqueta: "ID de orden", valor: "OT-2024-0587" },
        },
      },
    ],
  },
  {
    id: "conv-reserva-piscina",
    usuarioId: "carlos",
    titulo: "Reserva de piscina el jueves",
    modulo: "reserva",
    creadaEn: haceMinutos(6 * MINUTOS_POR_HORA),
    actualizadaEn: haceMinutos(5 * MINUTOS_POR_HORA + 40),
    ultimoMensaje: "Reserva confirmada · Código RSV-2048",
    mensajes: [
      {
        id: "m1",
        rol: "asistente",
        contenido:
          "¡Hola! Soy el asistente de TorreSegura. Cuéntame qué área común quieres reservar y para cuándo.",
        hora: "09:41",
      },
      {
        id: "m2",
        rol: "usuario",
        contenido: "Quiero reservar la piscina el jueves por la tarde para 5 personas.",
        hora: "09:41",
      },
      {
        id: "m3",
        rol: "asistente",
        contenido:
          "¡Buena noticia! Encontré disponibilidad: piscina el jueves de 12:30 a 17:45 para 5 personas. Reglas del área: sin vidrio, ducharse antes de ingresar, menores siempre acompañados.",
        hora: "09:42",
        tarjeta: {
          tipo: "disponibilidad",
          titulo: "Piscina disponible",
          icono: "water",
          horarioTexto: "Jueves · 12:30–17:45",
          personas: 5,
          reglas: [
            { icono: "wine-outline", texto: "Sin vidrio" },
            { icono: "water-outline", texto: "Ducharse antes de ingresar" },
            { icono: "people-outline", texto: "Menores siempre acompañados" },
          ],
          horariosAlternativos: [
            { id: "slot-piscina-2", texto: "08:00–11:30" },
            { id: "slot-piscina-3", texto: "18:00–21:30" },
          ],
        },
      },
      {
        id: "m4",
        rol: "usuario",
        contenido: "Perfecto, resérvame ese horario.",
        hora: "09:43",
      },
      {
        id: "m5",
        rol: "asistente",
        contenido:
          "Reserva confirmada. Jueves 22 de mayo, 12:30–17:45, piscina, 5 personas. Código de reserva: RSV-2048.",
        hora: "09:43",
        tarjeta: {
          tipo: "comprobante",
          titulo: "Comprobante de reserva",
          icono: "checkmark-circle",
          encabezadoExito: "Reserva confirmada",
          estado: { texto: "Confirmada", color: COLORS.success },
          campos: [
            {
              etiqueta: "Fecha",
              valor: "Jueves, 22 de mayo de 2025",
              icono: "calendar-outline",
            },
            { etiqueta: "Horario", valor: "12:30–17:45", icono: "time-outline" },
            { etiqueta: "Área", valor: "Piscina", icono: "water" },
            { etiqueta: "Personas", valor: "5", icono: "people-outline" },
          ],
          codigo: { etiqueta: "Código de reserva", valor: "RSV-2048" },
        },
      },
    ],
  },
  {
    id: "conv-visita-sofa",
    usuarioId: "carlos",
    titulo: "Entrega de sofá — 2 visitantes",
    modulo: "visita",
    creadaEn: haceMinutos(MINUTOS_POR_DIA + 30),
    actualizadaEn: haceMinutos(MINUTOS_POR_DIA),
    ultimoMensaje: "Tu visita ha sido registrada. Pase válido hasta las 12:00.",
    mensajes: [
      {
        id: "m1",
        rol: "asistente",
        contenido:
          "¡Hola! Soy el asistente de TorreSegura. Cuéntame quién vendrá, qué hará y a qué hora.",
        hora: "12:30",
      },
      {
        id: "m2",
        rol: "usuario",
        contenido: "Mañana vendrán 2 personas a entregar un sofá entre 10:00 y 12:00.",
        hora: "12:30",
      },
      {
        id: "m3",
        rol: "asistente",
        contenido:
          "Perfecto, esto es lo que entendí: 2 visitantes · Entrega · 10:00–12:00. ¿Quieres agregar una foto de referencia? (Esto es opcional)",
        hora: "12:30",
      },
      {
        id: "m4",
        rol: "usuario",
        contenido: "Sí, agrego la foto del sofá.",
        hora: "12:31",
        adjunto: { tipo: "imagen", uri: null },
      },
      {
        id: "m5",
        rol: "asistente",
        contenido:
          "He creado la solicitud de autorización: mañana 24 de mayo, 10:00–12:00, apartamento 4B, motivo entrega de sofá, 2 personas. La foto no se usa para reconocimiento facial.",
        hora: "12:31",
        tarjeta: {
          tipo: "resumen",
          titulo: "Solicitud de autorización",
          icono: "person-add",
          esSimulacion: true,
          campos: [
            {
              etiqueta: "Fecha",
              valor: "Mañana - 24 de mayo de 2025",
              icono: "calendar-outline",
            },
            { etiqueta: "Horario", valor: "10:00 – 12:00", icono: "time-outline" },
            { etiqueta: "Apartamento", valor: "4B", icono: "business-outline" },
            { etiqueta: "Motivo", valor: "Entrega de sofá", icono: "cube-outline" },
            { etiqueta: "Visitantes", valor: "2", icono: "people-outline" },
          ],
          nota: "La foto no se usa para reconocimiento facial.",
          acciones: [
            { id: "confirmar", texto: "Confirmar solicitud", variante: "primario" },
            { id: "cancelar", texto: "Cancelar", variante: "secundario" },
          ],
        },
      },
      {
        id: "m6",
        rol: "usuario",
        contenido: "Confirmo la solicitud.",
        hora: "12:32",
      },
      {
        id: "m7",
        rol: "asistente",
        contenido:
          "¡Listo! Tu visita ha sido registrada. Generé el pase temporal para el visitante, válido hasta las 12:00.",
        hora: "12:32",
        tarjeta: {
          tipo: "pase",
          titulo: "Pase temporal para el visitante",
          esSimulacion: true,
          codigoQR: "TS-DEMO-PASE-4520",
          validoHasta: "12:00",
          campos: [
            { etiqueta: "Motivo", valor: "Entrega de sofá", icono: "cube-outline" },
            { etiqueta: "Fecha", valor: "24 may 2025", icono: "calendar-outline" },
            { etiqueta: "Horario", valor: "10:00 – 12:00", icono: "time-outline" },
            { etiqueta: "Visitantes", valor: "2", icono: "people-outline" },
          ],
        },
      },
    ],
  },
  {
    id: "conv-cerradura-4b",
    usuarioId: "carlos",
    titulo: "Cierre de puerta 4B",
    modulo: "cerradura",
    creadaEn: haceMinutos(2 * MINUTOS_POR_DIA + 15),
    actualizadaEn: haceMinutos(2 * MINUTOS_POR_DIA),
    ultimoMensaje: "Puerta cerrada. Confirmado por la cerradura.",
    mensajes: [
      {
        id: "m1",
        rol: "asistente",
        contenido:
          "¡Hola! Soy el asistente de TorreSegura. Cuéntame qué problema encontraste en el edificio y me encargo de gestionarlo.",
        hora: "09:30",
      },
      {
        id: "m2",
        rol: "usuario",
        contenido: "Olvidé cerrar la puerta.",
        hora: "09:30",
      },
      {
        id: "m3",
        rol: "asistente",
        contenido:
          "Entiendo. Verifiqué el estado de la puerta de tu apartamento 4B: está abierta. Puedo cerrarla de forma segura, ¿deseas continuar?",
        hora: "09:30",
        tarjeta: {
          tipo: "resumen",
          titulo: "Estado de la puerta",
          icono: "shield-checkmark-outline",
          campos: [
            { etiqueta: "Apartamento", valor: "4B", icono: "business-outline" },
            {
              etiqueta: "Estado actual",
              valor: "Puerta abierta",
              icono: "lock-open-outline",
              colorValor: COLORS.error,
            },
            { etiqueta: "Actualizado", valor: "Hace 1 minuto", icono: "time-outline" },
          ],
          acciones: [
            { id: "confirmar", texto: "Cerrar puerta", variante: "primario", icono: "lock-closed" },
            { id: "cancelar", texto: "Cancelar", variante: "secundario" },
          ],
        },
      },
      {
        id: "m4",
        rol: "usuario",
        contenido: "Sí, ciérrala.",
        hora: "09:30",
      },
      {
        id: "m5",
        rol: "asistente",
        contenido:
          "Para tu seguridad, necesito confirmar la acción de cierre. Ingresa el código de verificación que enviamos a tu teléfono.",
        hora: "09:30",
      },
      {
        id: "m6",
        rol: "usuario",
        contenido: "Código ingresado.",
        hora: "09:31",
      },
      {
        id: "m7",
        rol: "asistente",
        contenido:
          "Puerta cerrada. Apartamento 4B, 20 may 2025 09:31. Confirmado por la cerradura principal.",
        hora: "09:31",
        tarjeta: {
          tipo: "comprobante",
          titulo: "Puerta cerrada",
          icono: "lock-closed",
          encabezadoExito: "Puerta cerrada",
          estado: { texto: "Cerrada", color: COLORS.success },
          campos: [
            { etiqueta: "Apartamento", valor: "4B", icono: "business-outline" },
            { etiqueta: "Fecha y hora", valor: "20 may 2025, 09:31", icono: "time-outline" },
            {
              etiqueta: "Dispositivo",
              valor: "Cerradura principal",
              icono: "hardware-chip-outline",
            },
          ],
        },
      },
    ],
  },
  {
    id: "conv-incidencia-fuga",
    usuarioId: "carlos",
    titulo: "Fuga de agua en pasillo del piso 3",
    modulo: "incidencia",
    creadaEn: haceMinutos(5 * MINUTOS_POR_DIA),
    actualizadaEn: haceMinutos(5 * MINUTOS_POR_DIA - 12),
    ultimoMensaje: "Reporte creado. El administrador lo revisará hoy.",
    mensajes: [
      {
        id: "m1",
        rol: "asistente",
        contenido:
          "¡Hola! Soy el asistente de TorreSegura. Cuéntame qué problema encontraste en el edificio y me encargo de gestionarlo.",
        hora: "18:05",
      },
      {
        id: "m2",
        rol: "usuario",
        contenido: "Hay una fuga de agua en el pasillo del piso 3, cerca del ascensor.",
        hora: "18:06",
      },
      {
        id: "m3",
        rol: "asistente",
        contenido:
          "Gracias por avisar. Categoría: Plomería · Prioridad: Alta por riesgo de resbalón. Marqué el área para señalización preventiva.",
        hora: "18:06",
        tarjeta: {
          tipo: "resumen",
          titulo: "Evaluación inicial",
          icono: "clipboard-outline",
          campos: [
            { etiqueta: "Categoría", valor: "Plomería", icono: "pricetag-outline" },
            {
              etiqueta: "Prioridad",
              valor: "Alta",
              icono: "flag-outline",
              colorValor: COLORS.error,
              puntoColor: true,
            },
            { etiqueta: "Estimado", valor: "$80–$120", icono: "cash-outline" },
            { etiqueta: "Tiempo", valor: "Mismo día", icono: "time-outline" },
          ],
          nota: "Prioridad alta por riesgo de resbalón. Se marcó el área para señalización preventiva.",
          acciones: [
            { id: "confirmar", texto: "Crear reporte", variante: "primario" },
            { id: "cancelar", texto: "Cancelar", variante: "secundario" },
          ],
        },
      },
      {
        id: "m4",
        rol: "usuario",
        contenido: "Sí, crea el reporte por favor.",
        hora: "18:07",
      },
      {
        id: "m5",
        rol: "asistente",
        contenido: "Reporte creado. El administrador lo revisará hoy.",
        hora: "18:07",
      },
    ],
  },
];
