// services/menuService.js
import { menuData } from "../utils/menuData";

// Simula una solicitud para obtener el menú según el rol
export const getMenuByRole = async (role) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const menu = menuData[role] || menuData.portero;
      resolve(menu);
    }, 500); // Simula un retraso de red
  });
};