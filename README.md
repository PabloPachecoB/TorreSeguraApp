# TorreSegura

Aplicación móvil (React Native + Expo) para la gestión de seguridad del edificio/condominio: control de visitantes, acceso por código QR, áreas comunes, alertas/notificaciones y pagos. Contempla tres roles: **Vigilante**, **Residente** y **Gerente**.

> Nota: el rol **Gerente** aún no está considerado en el flujo de login (`screens/LoginScreen.js`), por lo que hoy no es posible iniciar sesión con ese rol. Sí está contemplado a nivel de detalle en algunas vistas (menús, permisos, alertas), pendiente de integrarlo en la navegación de acceso.

Este repositorio contiene solo el **frontend**. Se conecta a una API REST separada (backend) mediante la variable `API_BASE`.

## Stack

- [Expo](https://expo.dev/) (React Native 0.81, React 19)
- React Navigation (native stack)
- Axios para llamadas a la API
- Context API para estado de usuario/sesión y navegación (`context/`)
- `expo-secure-store` + `AsyncStorage` para almacenamiento de tokens
- NativeWind/Tailwind configurado, aunque el estilo actual de los componentes usa `StyleSheet.create` de React Native
- `expo-camera` / `react-native-qrcode-svg` para generación y escaneo de QR

## Requisitos previos

- Node.js y npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`)
- Expo Go (para probar en un dispositivo físico) o un emulador Android/iOS configurado
- Acceso a una instancia del backend (ver variable `API_BASE` abajo)

## Configuración

Crea un archivo `.env` en la raíz del proyecto con la URL base de la API:

```
API_BASE=http://TU_IP_O_HOST:8000
```

Notas:
- **No agregues comentarios al final de la línea** en `.env` (el loader de `react-native-dotenv` rompe el valor).
- Emulador Android: usa `http://10.0.2.2:8000` para apuntar al `localhost` de tu máquina.
- Dispositivo físico con Expo Go: usa la IP LAN de tu máquina (misma red Wi‑Fi que el backend), por ejemplo `http://192.168.0.2:8000`.

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm start        # expo start — abre Metro/Dev Tools (elige plataforma desde ahí)
npm run android  # expo run:android
npm run ios      # expo run:ios
npm run web      # expo start --web
```

> Nota: actualmente no hay scripts de `lint` ni de `test` configurados en el proyecto.

## Estructura del proyecto

```
App.js               # Entry point de la app, providers y carga de fuentes
index.js             # registerRootComponent (Expo)
navigation/           # Stack de navegación (React Navigation)
context/              # UserContext (sesión/tokens) y NavigationContext (tab activo)
screens/              # Pantallas de la app (una por vista)
components/           # Componentes reutilizables (BottomNav, Card, botones, etc.)
services/              # Cliente Axios (apiClient) y servicios por dominio (auth, pagos, alertas, accesos, áreas, etc.)
hooks/                 # Hooks custom (carga de fuentes, polling de alertas)
constants/             # Colores, tamaños y definición de roles
utils/                 # Datos de menú por rol, helpers de diseño responsive
assets/                # Íconos, splash, sonidos, etc.
```

## Diseño responsive

`utils/responsive.js` expone helpers para adaptar la UI a pantallas pequeñas (breakpoints en 480/768/1024px de ancho):

- `isSmallDevice` / `isMediumDevice` / `isLargeDevice` — flags según el ancho de pantalla.
- `responsiveValue(base, smallValue?)` — devuelve un valor distinto en dispositivos pequeños (por defecto, 85% del base).
- `responsiveFontSize(size)` / `responsivePadding(size)` — variantes de `responsiveValue` para fuente y padding.
- `responsiveWidth(%)` / `responsiveHeight(%)` — porcentaje del ancho/alto real de pantalla.

Pantallas como `HomeScreen`, `LoginScreen` y el componente `Card` ya usan estos helpers (combinados con `Math.min(...)` para topar tamaños de fuente) para evitar overflow en pantallas ≤ 5". Al tocar esas pantallas o crear nuevas, preferir estos helpers sobre valores fijos en píxeles.

## Estado del proyecto

El proyecto está en desarrollo activo, no listo para producción.

**Funcional:**
- Navegación: stack registrado correctamente, pantallas accesibles.
- Autenticación: login con access/refresh token, refresco automático ante 401 y almacenamiento seguro (SecureStore con fallback a AsyncStorage).
- Home/Menú: arma tarjetas según el rol del usuario autenticado.
- Visitantes/QR: flujo de creación y verificación de visitas vía QR.
- Alertas/Notificaciones/Pagos: implementados y conectados a la API.

**Pendientes/riesgos conocidos:**
- El rol **Gerente** no está contemplado en la navegación post-login (ver `screens/LoginScreen.js`), aunque sí existe en menús y permisos de algunas vistas — ver nota más arriba.
- Persisten referencias mixtas a nombres de rol en algunas pantallas (`Residente/Vigilante` vs. `propietario/portero`), heredadas de datos de prueba en `utils/users.js`.
- No hay scripts de `lint` ni `test` configurados — la validación de cambios es manual.

Para el detalle de la arquitectura (flujo de autenticación, manejo de tokens, patrón de servicios, convenciones de estilo, etc.), ver [`CLAUDE.md`](./CLAUDE.md) (uso local para asistentes de código, no versionado en el remoto).

## Flujo de trabajo

Cada colaborador debe crear su propia rama para desarrollar cambios (no trabajar directo sobre `main`).
