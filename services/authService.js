// services/authService.js
import { users } from "../utils/users";

export const login = async (username, password) => {
  console.log("Iniciando login en authService...");
  console.log("Usuarios disponibles:", users);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log("Buscando usuario con username:", username, "y password:", password);
      const user = users.find(
        (u) => u.username === username && u.password === password
      );
      if (user) {
        console.log("Usuario encontrado en authService:", user);
        const token = "fake-jwt-token";
        resolve({ username: user.name, role: user.role, token });
      } else {
        console.log("Usuario no encontrado en authService");
        reject(new Error("Usuario o contraseña incorrectos"));
      }
    }, 500);
  });
};

export const logout = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
};