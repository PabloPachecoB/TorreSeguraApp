// context/UserContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearTokens, getAccessToken, setAccessToken, setRefreshToken } from "../services/tokenStorage";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("Cargando datos de usuario desde AsyncStorage...");
        
        // Cargar usuario
        const storedUser = await AsyncStorage.getItem("user");
        // Intentar cargar token desde SecureStore/AsyncStorage
        const storedToken = (await getAccessToken()) || (await AsyncStorage.getItem("token"));
        
        console.log("Usuario encontrado:", storedUser);
        console.log("Token encontrado:", storedToken);
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log("Usuario cargado en contexto:", parsedUser);
        }
        
        if (storedToken) {
          setToken(storedToken);
          console.log("Token cargado en contexto:", storedToken);
        }
        
        if (!storedUser && !storedToken) {
          console.log("No se encontraron datos de usuario ni token");
        }
      } catch (error) {
        console.error("Error al cargar datos desde AsyncStorage:", error);
      }
    };
    
    loadUserData();
  }, []);

  const saveUser = async (newUser, userToken) => {
    try {
      console.log("Guardando usuario:", newUser);
      console.log("Guardando token:", userToken);
      
      // Guardar usuario
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      
      if (userToken) {
        await setAccessToken(userToken);
        await AsyncStorage.setItem("token", userToken); // compatibilidad
        setToken(userToken);
      }
      
      console.log("Usuario y token guardados correctamente");
    } catch (error) {
      console.error("Error al guardar datos:", error);
      throw error;
    }
  };

  // Función alternativa si el token viene dentro del objeto user
  const saveUserWithEmbeddedToken = async (userData) => {
    try {
      console.log("Guardando datos de usuario completos:", userData);
      
      // Extraer token del objeto userData si existe
      const userToken = userData.token || userData.accessToken || userData.authToken;
      const refreshToken = userData.refresh || userData.refreshToken;
      
      // Guardar usuario sin los tokens (limpio)
      const userWithoutToken = { ...userData };
      delete userWithoutToken.token;
      delete userWithoutToken.accessToken;
      delete userWithoutToken.authToken;
      delete userWithoutToken.refresh;
      delete userWithoutToken.refreshToken;
      
      await AsyncStorage.setItem("user", JSON.stringify(userWithoutToken));
      setUser(userWithoutToken);
      
      // Guardar tokens por separado (SecureStore preferido)
      if (userToken) {
        await setAccessToken(userToken);
        await AsyncStorage.setItem("token", userToken); // compatibilidad
        await AsyncStorage.setItem("accessToken", userToken); // compatibilidad
        setToken(userToken);
        console.log("Access token guardado:");
      }

      if (refreshToken) {
        await setRefreshToken(refreshToken);
        await AsyncStorage.setItem("refreshToken", refreshToken); // compatibilidad
        console.log("Refresh token guardado");
      }
      
      console.log("Datos guardados correctamente");
    } catch (error) {
      console.error("Error al guardar datos:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("Cerrando sesión...");
      // Limpiar todos los tokens y datos de usuario
      await clearTokens();
      await AsyncStorage.multiRemove(["user", "token", "accessToken", "refreshToken"]);
      setUser(null);
      setToken(null);
      console.log("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const updateToken = async (newToken) => {
    try {
      console.log("Actualizando token:", newToken);
      await setAccessToken(newToken);
      await AsyncStorage.setItem("token", newToken);
      setToken(newToken);
    } catch (error) {
      console.error("Error al actualizar token:", error);
      throw error;
    }
  };

  // Debug: Agregar logs para verificar estado
  useEffect(() => {
    console.log("=== ESTADO DEL CONTEXTO ===");
    console.log("User:", user);
    console.log("Token:", token);
    console.log("Token type:", typeof token);
    console.log("Token length:", token?.length);
    console.log("=============================");
  }, [user, token]);

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        token, 
        saveUser, 
        saveUserWithEmbeddedToken,
        logout, 
        updateToken,
        isAuthenticated: !!(user && token)
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);