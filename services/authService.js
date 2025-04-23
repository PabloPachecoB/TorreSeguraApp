// services/authService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "@env"

const API_URL = `${API_BASE}/api/token/`;


export const login = async (username, password) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || errorData.detail || "Error de autenticación";
      throw new Error(errorMessage);
    }


    const data = await response.json();

    const accessToken = data.access;
    const refreshToken = data.refresh;

    // Guardamos tokens
    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);

    // ✅ Ahora obtenemos el perfil del usuario
    const profileResponse = await fetch(`${API_BASE}/api/me/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!profileResponse.ok) {
      throw new Error("No se pudo obtener la información del usuario");
    }

    const user = await profileResponse.json();

    // ✅ Retornamos todo lo que LoginScreen necesita
    return {
      username: user.username,
      rol: user.rol, // 👈 esto incluye .nombre, .descripcion, etc.
      token: accessToken,
      refresh: refreshToken,
    };
  } catch (error) {
    // console.error("Login error:", error.message);
    throw error;
  }
};

