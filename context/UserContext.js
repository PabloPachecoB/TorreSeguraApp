// context/UserContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("Cargando usuario desde AsyncStorage...");
        const storedUser = await AsyncStorage.getItem("user");
        console.log("Usuario encontrado en AsyncStorage:", storedUser);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log("Usuario cargado en contexto:", parsedUser);
        } else {
          console.log("No se encontró usuario en AsyncStorage");
        }
      } catch (error) {
        console.error("Error al cargar el usuario desde AsyncStorage:", error);
      }
    };
    loadUser();
  }, []);

  const saveUser = async (newUser) => {
    try {
      console.log("Guardando usuario en AsyncStorage:", newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      console.log("Usuario guardado correctamente en contexto y AsyncStorage");
    } catch (error) {
      console.error("Error al guardar el usuario en AsyncStorage:", error);
      throw error; // Propagar el error para que se capture en handleLogin
    }
  };

  const logout = async () => {
    try {
      console.log("Cerrando sesión...");
      await AsyncStorage.removeItem("user");
      setUser(null);
      console.log("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, saveUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);