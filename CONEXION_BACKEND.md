# Conexión del backend — Asistente TorreSegura

Este documento es el mapa para conectar el asistente cuando existan los endpoints reales.

**La regla:** todo el acceso a datos vive en `services/`. Cuando lleguen los endpoints, solo hay que reemplazar el cuerpo de esas funciones. **Ningún componente de UI necesita cambiar.**

Cada punto mock lleva un comentario `// TODO: conectar endpoint real` en el código, con el `api.*` de ejemplo ya escrito como comentario.

Cubre cuatro piezas:

| Pieza | Capa de datos | Sección |
|---|---|---|
| Historial de conversaciones | `services/conversacionesService.js` | §1 – §5 |
| Reservas de áreas comunes (RES-04) | `services/reservasService.js` | §7 |
| Visitantes (VIS-01 · simulación) | `services/visitasService.js` | §8 |
| Respuestas del agente | `services/agenteService.js` + `agenteSimulador.js` | §9 |

**Empieza por §9.** El simulador del agente es el andamiaje más grande y el primero que hay que sacar.

---

## 1. Estado actual: de dónde salen los datos

```
components/agente/*.js         ─┐
components/HistorialDrawer.js  ─┤ (solo UI, reciben datos por props)
components/ConversacionItem.js ─┤
screens/ChatScreen.js          ─┘
              │
              ▼
services/   ← ESTA ES LA ÚNICA CAPA A CAMBIAR
              │
              ├── conversacionesService.js ── AsyncStorage + data/mockConversaciones.js
              ├── reservasService.js ──────── data/mockReservas.js
              ├── visitasService.js ───────── data/mockVisitas.js (estado en memoria)
              └── agenteService.js ────────── agenteSimulador.js  (si MODO_DEMO_AGENTE)
```

Al conectar el backend, las cajas de la derecha se reemplazan por `api` (`services/apiClient.js`), que ya inyecta el `Authorization: Bearer` automáticamente.

---

## 2. Funciones de acceso a datos — historial

Todas están en **`services/conversacionesService.js`**.

| Función | Línea | Recibe | Devuelve hoy (mock) |
|---|---|---|---|
| `getConversaciones` | 55 | `userId` | `Promise<Conversacion[]>` ordenado por `actualizadaEn` desc. `[]` si no hay historial. |
| `getConversacion` | 81 | `userId, id` | `Promise<Conversacion \| null>` con todos sus `mensajes`. |
| `crearConversacion` | 108 | `userId, { modulo?, titulo? }` | `Promise<Conversacion>` recién creada, con `mensajes: []`. |
| `guardarMensaje` | 145 | `userId, id, mensaje` | `Promise<Conversacion \| null>` actualizada. Renombra la conversación con el primer mensaje del usuario. |
| `guardarIdAgente` | 193 | `userId, id, agenteConversacionId` | `Promise<void>`. Ver §4. |
| `eliminarConversacion` | 214 | `userId, id` | `Promise<boolean>` — `true` si borró, `false` si no existía. |

### Qué cambiar en cada una

**`getConversaciones(userId)`** — línea 55

```js
try {
  const { data } = await api.get("/agente/conversaciones/");
  return data.sort(porFechaDesc);
} catch (err) {
  throw new Error(normalizeApiError(err).message);
}
```
El `userId` probablemente no viaje como parámetro: el backend deduce el dueño del token. Si el endpoint lo pidiera, sería `?usuario=${userId}`. **Mantén la firma con `userId` aunque no lo uses**, así `ChatScreen` no se toca.

**`getConversacion(userId, id)`** — línea 81

```js
try {
  const { data } = await api.get(`/agente/conversaciones/${id}/`);
  return data;
} catch (err) {
  throw new Error(normalizeApiError(err).message);
}
```
Debe devolver la conversación **con sus `mensajes` incluidos**. Si el backend los expone aparte (`/agente/conversaciones/${id}/mensajes/`), haz las dos llamadas aquí dentro y devuelve el objeto ya armado — la UI espera un solo objeto completo.

**`crearConversacion(userId, opciones)`** — línea 108

```js
try {
  const { data } = await api.post("/agente/conversaciones/", { modulo, titulo });
  return data; // el backend genera id, creadaEn y actualizadaEn
} catch (err) {
  throw new Error(normalizeApiError(err).message);
}
```

**`guardarMensaje(userId, id, mensaje)`** — línea 145

Probablemente **se vuelva innecesaria**: el endpoint del agente (`POST /agente/chat/`) ya persiste los mensajes del lado del servidor. En ese caso conviértela en un no-op (`return null`) y borra sus llamadas en `ChatScreen` (líneas 99, 131). Si existiera endpoint propio:

```js
await api.post(`/agente/conversaciones/${id}/mensajes/`, mensaje);
```

Ojo: hoy esta función también **genera el título** a partir del primer mensaje del usuario (`recortarTitulo`, línea 236). Si la eliminas, confirma que el backend devuelve un `titulo` — si no, el drawer mostrará "Nueva conversación" en todo.

**`eliminarConversacion(userId, id)`** — línea 214

```js
try {
  await api.delete(`/agente/conversaciones/${id}/`);
  return true;
} catch (err) {
  throw new Error(normalizeApiError(err).message);
}
```

---

## 3. Otros puntos con datos falsos

| Punto | Archivo | Qué pasa con el backend |
|---|---|---|
| Las 5 conversaciones de ejemplo | `data/mockConversaciones.js` (archivo completo) | **Se borra el archivo entero**, y con él el import de la línea 15 de `conversacionesService.js`. |
| Siembra + persistencia local | `conversacionesService.js:34` (`leerHistorial`) y `:44` (`escribirHistorial`) | **Se borran ambas.** Con backend no hay nada que sembrar ni que guardar localmente. También sobra la constante `STORAGE_PREFIX` (línea 20) y el import de `AsyncStorage` (línea 14). |
| Identidad de la cuenta | `screens/ChatScreen.js:50` | Hoy: `user?.id ?? user?.username`. Cuando el login devuelva un id numérico real, esto ya lo toma solo — pero **verifícalo**: si el backend filtra por token, este `userId` pasa a ser irrelevante para el servidor y queda solo como parámetro de firma. |
| Las tarjetas de los flujos (`tarjeta: {...}`) | `data/mockConversaciones.js` | Hoy solo se guardan como dato y se renderizan como texto plano. Cuando el agente devuelva tarjetas reales, hay que construir los componentes de tarjeta — **eso es trabajo de UI aparte, no de esta capa.** |

---

## 4. La cuestión de los dos ids (importante)

Hoy conviven **dos identificadores distintos** para lo que en el futuro será una sola cosa:

- **`id`** — id local de la conversación en el historial (lo genera `crearConversacion`, formato `conv-<timestamp>`).
- **`agenteConversacionId`** — el `conversacion_id` que devuelve `POST /agente/chat/` (ver `services/agenteService.js:12`). Es el hilo del agente.

`ChatScreen` los mantiene en dos refs separados a propósito (líneas 60-63) y los une con `guardarIdAgente` (línea 150). Esto existe **solo porque el historial es local y el agente es remoto**.

**Cuando el backend exponga el historial, los dos ids son el mismo.** Entonces:
1. Borra `guardarIdAgente` (`conversacionesService.js:193`) y su llamada en `ChatScreen.js:150`.
2. Borra el ref `agenteConversacionIdRef` de `ChatScreen` y usa `conversacionIdRef` en la llamada a `enviarMensajeAgente` (línea 143).
3. Quita el campo `agenteConversacionId` del modelo.

Este es el único punto donde la UI tiene algo de andamiaje del mock. Todo lo demás está limpio.

---

## 5. Modelo de datos que debe devolver el endpoint

Para que la UI no cambie, el backend debería devolver esta forma (o adaptarla dentro del service):

```js
// Conversacion
{
  id: string,
  usuarioId: string,
  titulo: string,              // se muestra en el drawer
  modulo: "reserva" | "incidencia" | "visita" | "cerradura",
  creadaEn: string,            // ISO 8601
  actualizadaEn: string,       // ISO 8601 — criterio de orden del listado
  ultimoMensaje: string,       // preview de la última línea
  mensajes: Mensaje[],
}

// Mensaje
{
  id: string,
  rol: "usuario" | "asistente",
  contenido: string,
  hora: string,                // "09:41", ya formateado
  tarjeta?: Tarjeta,           // opcional — contrato en §6
  adjunto?: { tipo, uri },     // opcional
}
```

Notas sobre los campos:
- **`modulo`**: si llega un valor desconocido, `getModulo` (`constants/modulos.js`) hace fallback a `incidencia` sin romper la UI.
- **`hora`**: hoy viene pre-formateada. Si el backend manda un ISO, formatéalo dentro del service, no en el componente.
- **`actualizadaEn`**: `utils/fechaRelativa.js` lo convierte en "hace 2 h" / "ayer". Necesita ISO válido; si es inválido devuelve cadena vacía y no rompe.

---

## 6. Contrato de `tarjeta` (APP-01) — lo más importante para el backend

Una tarjeta es **lo que el agente quiere que la app dibuje**. La app no interpreta el dominio: mira `tipo`, elige un componente y pinta los `campos` que le manden.

**Esto significa que el backend puede agregar flujos nuevos sin tocar la app**, mientras use uno de los seis tipos existentes.

```js
// Tarjeta
{
  tipo: "resumen" | "comprobante" | "error" | "disponibilidad" | "pase" | "llegada",
  titulo: string,
  icono?: string,              // nombre de Ionicons
  estado?: { texto, color },   // badge junto al título
  campos?: [{ etiqueta, valor, icono?, colorValor?, puntoColor? }],
  nota?: string,               // aviso al pie, sobre naranja suave
  esSimulacion?: boolean,      // dibuja el sello "Simulación" (ver §8)
  acciones?: [{ id, texto, variante: "primario"|"secundario", icono?, deshabilitada? }],

  // extras según el tipo:
  encabezadoExito?: string,               // comprobante
  codigo?: { etiqueta, valor },           // comprobante
  mensaje?: string, detalle?: string,     // error
  permiteReintentar?: boolean,            // error (default true)
  horarioTexto?, personas?, reglas?, horariosAlternativos?,  // disponibilidad
  codigoQR?, validoHasta?,                // pase
  subtitulo?, cuando?, visitantes?,       // llegada
}
```

**Cómo funcionan las acciones.** Cada `accion.id` que mandes vuelve tal cual a `ejecutarAccionAgente` cuando el usuario toca el botón. El backend define los ids y decide qué hacer con ellos; la app solo los transporta. Los ids que hoy usa el simulador: `confirmar`, `cancelar`, `reservar_slot`, `elegir_horario:<slotId>`, `ver_llegada`, `permitir_ingreso`, `rechazar_ingreso`, `reintentar`.

Dónde se resuelve el `tipo`: `components/agente/TarjetaMensaje.js`. **Es el único archivo a tocar para soportar un tipo nuevo.** Un `tipo` desconocido no rompe la pantalla: la tarjeta no se dibuja y el texto del mensaje se muestra igual.

---

## 7. Reservas de áreas comunes (RES-04)

Todo en **`services/reservasService.js`**. El mock está en `data/mockReservas.js` (áreas, reglas, slots).

| Función | Línea | Recibe | Devuelve hoy (mock) |
|---|---|---|---|
| `getAreas` | 27 | — | `Promise<Area[]>` — `{ id, nombre, icono, reglas[] }`. |
| `buscarArea` | 41 | `texto` | `Promise<Area\|null>` — match aproximado sobre lo que escribió el usuario. |
| `getDisponibilidad` | 65 | `{ areaId, dia, personas }` | `Promise<{area, dia, fecha, slots[]}\|null>`. `slots` vacío si no hay nada libre. |
| `confirmarReserva` | 102 | `{ slotId, personas }` | `Promise<Reserva>` — `{ codigo, area, fecha, horario, personas, estado }`. **Lanza** si el slot no existe. |

Reemplazos:

```js
// getDisponibilidad
const { data } = await api.get("/areas/disponibilidad/", {
  params: { area: areaId, dia, personas },
});
return data;

// confirmarReserva
const { data } = await api.post("/reservas/", { slot: slotId, personas });
return data; // el backend genera el código
```

Dos cosas a tener en cuenta:

- **`buscarArea` probablemente desaparezca.** Hoy adivina el área con `includes()` sobre el texto del usuario. Eso lo va a resolver el agente del lado del servidor, mucho mejor.
- **`confirmarReserva` lanza a propósito** cuando el slot no existe, y ese error sube hasta la tarjeta de error. Mantené ese comportamiento: si se traga el error y devuelve algo, el usuario ve un comprobante de una reserva que no existe.
- El código `RSV-2048` sale de un contador en `data/mockReservas.js`. Con backend, el código lo genera el servidor.

---

## 8. Visitantes (VIS-01 · simulación)

Todo en **`services/visitasService.js`**. Mock en `data/mockVisitas.js`.

**Leé esto antes de conectar nada:** este módulo es P2 / simulación. No registra visitas reales ni emite pases verificables. El flujo real de accesos y QR ya existe en `services/accesosService.js` y **no pasa por acá**. Al conectar el backend hay que decidir si estas funciones se conectan de verdad o si el asistente delega en `accesosService`. Probablemente lo segundo.

| Función | Línea | Recibe | Devuelve hoy (mock) |
|---|---|---|---|
| `getMotivos` | 25 | — | `Promise<Motivo[]>` — `{ clave, etiqueta, icono }`. |
| `crearSolicitudVisita` | 39 | `{ usuarioId, apartamento, motivo, fecha, horario, visitantes }` | `Promise<Visita>` con `codigoQR` y `validoHasta`. |
| `getVisita` | 68 | `id` | `Promise<Visita\|null>`. |
| `simularLlegadaVisitante` | 86 | `id` | `Promise<Visita\|null>` en estado `en_puerta`. **Ver abajo.** |
| `responderLlegada` | 105 | `id, decision` | `Promise<Visita\|null>` en estado `autorizada` / `rechazada`. |

Puntos que hay que mirar con cuidado:

- **`simularLlegadaVisitante` se BORRA.** No tiene equivalente real: la llegada del visitante la notifica el servidor (push / websocket) cuando portería la registra, no la pide la app. Hoy existe solo para poder mostrar ese paso en la demo, y está expuesta como un botón "Simular llegada del visitante" dentro de la tarjeta del pase. **Ese botón también se borra.**
- **El QR es un placeholder.** Codifica el texto `TS-DEMO-PASE-<n>` que genera el mock. No lo valida nadie. Con backend, el `codigoQR` debe venir del servidor y ser un token verificable.
- **El estado vive en memoria** (`visitasDemo`, línea 18), no en AsyncStorage. Se pierde al cerrar la app, a propósito: son datos de simulación y no deberían sobrevivir como si fueran reales.

---

## 9. El simulador del agente — el andamiaje a sacar primero

| Archivo | Qué es |
|---|---|
| `constants/config.js:19` | `MODO_DEMO_AGENTE`. Hoy en `true`. |
| `services/agenteSimulador.js` | **Archivo entero de demo.** Genera las respuestas y tarjetas del agente sin backend. |
| `services/agenteService.js:24` y `:57` | Las dos ramas `if (MODO_DEMO_AGENTE)`. |
| `screens/ChatScreen.js:371` | El badge "Demo" del header. |

**Por qué es un flag y no un fallback.** El chat no cae en simulación cuando el backend falla. Si `MODO_DEMO_AGENTE` está en `false` y el endpoint falla, se muestra la tarjeta de error. Esto es deliberado: el hallazgo crítico #5 de `ESTADO_ACTUAL_PROYECTO.md` es justamente "flujos que ante error de backend muestran éxito simulado". Un fallback silencioso reconstruiría ese bug.

**Para desconectarlo:** poner `MODO_DEMO_AGENTE = false`, borrar `agenteSimulador.js` y las dos ramas de `agenteService.js`. El badge del header se apaga solo.

**Lo que falta definir del lado del backend:** `ejecutarAccionAgente` (`agenteService.js:50`) no tiene endpoint. No inventé su forma. Hoy, fuera del modo demo, **lanza un error explícito** en vez de fingir que la acción se ejecutó. Cuando definas el endpoint, el ejemplo comentado en esa función es un punto de partida — necesita recibir el `action_id` y el `conversacion_id`.

**Lo que el simulador NO cubre:** el flujo de cerradura no está simulado. "Olvidé cerrar la puerta" hoy cae en el flujo de incidencia y se categoriza como "Cerradura". Las tarjetas de cerradura sí existen y se ven en el historial de ejemplo.

---

## 10. Checklist de conexión

**Agente (empezar por acá):**
- [ ] Definir el endpoint de acciones y completar `ejecutarAccionAgente` (`agenteService.js:50`).
- [ ] Confirmar que `/agente/chat/` devuelve `tarjeta` con el contrato de §6.
- [ ] Poner `MODO_DEMO_AGENTE = false` (`constants/config.js:19`).
- [ ] Borrar `services/agenteSimulador.js` y las ramas `if (MODO_DEMO_AGENTE)` de `agenteService.js`.

**Historial:**
- [ ] Descomentar el import de `api` / `normalizeApiError` en `conversacionesService.js` (línea 16).
- [ ] Reemplazar el cuerpo de las 4 funciones principales (§2).
- [ ] Resolver `guardarMensaje`: no-op o endpoint propio (§2).
- [ ] Borrar `leerHistorial`, `escribirHistorial`, `STORAGE_PREFIX` y el import de AsyncStorage.
- [ ] Borrar `data/mockConversaciones.js`.
- [ ] Unificar los dos ids y borrar `guardarIdAgente` (§4).
- [ ] Confirmar que el backend devuelve `titulo` (si no, mantener `recortarTitulo`).

**Reservas:**
- [ ] Reemplazar `getDisponibilidad` y `confirmarReserva` (§7).
- [ ] Decidir si `buscarArea` sobrevive o lo resuelve el agente.
- [ ] Borrar `data/mockReservas.js` y los `esperar()` de latencia simulada.

**Visitantes:**
- [ ] Decidir si el asistente delega en `accesosService.js` en vez de tener su propia capa (§8).
- [ ] Borrar `simularLlegadaVisitante` y la acción `ver_llegada` que la dispara.
- [ ] Reemplazar el QR placeholder por un token real del servidor.
- [ ] Sacar `esSimulacion: true` de las tarjetas de visita cuando dejen de serlo.
- [ ] Borrar `data/mockVisitas.js`.

**Al terminar:**
- [ ] Verificar que **ningún archivo de `components/` haya necesitado cambios**, y que en `screens/ChatScreen.js` solo hayan cambiado el punto §4 y el badge de demo. Si tocaste otra cosa, la abstracción tiene una fuga — avisá.
