// data/mockVisitas.js
//
// TODO: conectar endpoint real — este archivo desaparece cuando exista el
// backend de visitas. Solo lo consume services/visitasService.js.
//
// OJO: el módulo de visitantes del asistente es P2 / simulación. Nada de lo que
// hay acá crea una visita real ni un pase verificable. El flujo real de accesos
// vive en services/accesosService.js y NO pasa por aquí.

/** Motivos de visita que el simulador reconoce en el texto del usuario. */
export const MOCK_MOTIVOS = [
  { clave: "entrega", etiqueta: "Entrega", icono: "cube-outline" },
  { clave: "mudanza", etiqueta: "Mudanza", icono: "car-outline" },
  { clave: "visita", etiqueta: "Visita social", icono: "people-outline" },
  { clave: "servicio", etiqueta: "Servicio técnico", icono: "construct-outline" },
];

/** Visitas de ejemplo ya registradas, para poblar la demo. */
export const MOCK_VISITAS = [
  {
    id: "vis-sofa",
    usuarioId: "carlos",
    apartamento: "4B",
    motivo: "Entrega de sofá",
    motivoClave: "entrega",
    fecha: "24 de mayo de 2025",
    horario: "10:00 – 12:00",
    visitantes: 2,
    validoHasta: "12:00",
    estado: "registrada",
  },
];

/** Contador de pases. El QR de demo codifica este texto, no un token real. */
let ultimoPase = 4520;

export const siguienteCodigoPase = () => {
  ultimoPase += 1;
  return `TS-DEMO-PASE-${ultimoPase}`;
};
