import axios from 'axios';

const API_URL = 'http://192.168.0.13:8000/api/alertas/';  // 🔁 Reemplaza con la IP real de tu servidor Django

export const enviarAlerta = async (titulo, descripcion, tipo) => {
  try {
    const response = await axios.post(API_URL, {
      titulo,
      descripcion,
      tipo
    });
    console.log('✅ Alerta enviada:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error al enviar alerta:', error.response?.data || error.message);
    throw error;
  }
};


