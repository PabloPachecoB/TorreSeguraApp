// data/mockReservas.js
//
// TODO: conectar endpoint real — este archivo desaparece cuando exista el
// backend de reservas. Solo lo consume services/reservasService.js; ningún
// componente de UI lo importa.
//
// Modelo de un área:
//   id, nombre, icono (Ionicons), reglas[{ icono, texto }]
// Modelo de un slot:
//   id, areaId, dia, horario, capacidad

export const MOCK_AREAS = [
  {
    id: "piscina",
    nombre: "Piscina",
    icono: "water",
    reglas: [
      { icono: "wine-outline", texto: "Sin vidrio" },
      { icono: "water-outline", texto: "Ducharse antes de ingresar" },
      { icono: "people-outline", texto: "Menores siempre acompañados" },
    ],
  },
  {
    id: "salon",
    nombre: "Salón de eventos",
    icono: "business",
    reglas: [
      { icono: "volume-mute-outline", texto: "Silencio después de las 22:00" },
      { icono: "trash-outline", texto: "Dejar el área limpia" },
    ],
  },
  {
    id: "parrilla",
    nombre: "Parrilla",
    icono: "flame",
    reglas: [
      { icono: "flame-outline", texto: "Apagar brasas al terminar" },
      { icono: "trash-outline", texto: "Dejar el área limpia" },
    ],
  },
  {
    id: "gimnasio",
    nombre: "Gimnasio",
    icono: "barbell",
    reglas: [
      { icono: "time-outline", texto: "Máximo 90 minutos" },
      { icono: "shirt-outline", texto: "Calzado deportivo obligatorio" },
    ],
  },
];

// Slots de ejemplo. `dia` en minúsculas para poder matchear el texto del usuario.
export const MOCK_SLOTS = [
  { id: "slot-piscina-1", areaId: "piscina", dia: "jueves", horario: "12:30–17:45", capacidad: 12 },
  { id: "slot-piscina-2", areaId: "piscina", dia: "jueves", horario: "08:00–11:30", capacidad: 12 },
  { id: "slot-piscina-3", areaId: "piscina", dia: "jueves", horario: "18:00–21:30", capacidad: 10 },
  { id: "slot-piscina-4", areaId: "piscina", dia: "viernes", horario: "10:00–13:00", capacidad: 12 },
  { id: "slot-salon-1", areaId: "salon", dia: "sábado", horario: "16:00–22:00", capacidad: 40 },
  { id: "slot-salon-2", areaId: "salon", dia: "sábado", horario: "10:00–14:00", capacidad: 40 },
  { id: "slot-parrilla-1", areaId: "parrilla", dia: "domingo", horario: "12:00–16:00", capacidad: 8 },
  { id: "slot-parrilla-2", areaId: "parrilla", dia: "domingo", horario: "17:00–21:00", capacidad: 8 },
  { id: "slot-gimnasio-1", areaId: "gimnasio", dia: "lunes", horario: "07:00–08:30", capacidad: 6 },
  { id: "slot-gimnasio-2", areaId: "gimnasio", dia: "lunes", horario: "19:00–20:30", capacidad: 6 },
];

/** Fecha legible por día de la semana, para el comprobante. */
export const MOCK_FECHAS = {
  lunes: "Lunes, 19 de mayo de 2025",
  martes: "Martes, 20 de mayo de 2025",
  miércoles: "Miércoles, 21 de mayo de 2025",
  jueves: "Jueves, 22 de mayo de 2025",
  viernes: "Viernes, 23 de mayo de 2025",
  sábado: "Sábado, 24 de mayo de 2025",
  domingo: "Domingo, 25 de mayo de 2025",
};

/** Contador de códigos de reserva. Arranca en 2047 para que el primero sea RSV-2048. */
export let ultimoCodigoReserva = 2047;

export const siguienteCodigoReserva = () => {
  ultimoCodigoReserva += 1;
  return `RSV-${ultimoCodigoReserva}`;
};
