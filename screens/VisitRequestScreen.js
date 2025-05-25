import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { useUserContext } from '../context/UserContext';
import { COLORS } from '../constants';
import { API_BASE } from "@env"

export default function VisitRequestScreen({ navigation }) {
  // ✅ Cambio principal: extraer token directamente del contexto
  const { user, token } = useUserContext();
  
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [motivo, setMotivo] = useState('');
  const [qrBase64, setQrBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Debug mejorado para verificar los datos
  useEffect(() => {
    console.log("=== DEBUG VISIT REQUEST SCREEN ===");
    console.log("user object:", user);
    console.log("token:", token);
    console.log("typeof token:", typeof token);
    console.log("token length:", token?.length);
    console.log("vivienda_destino_id:", user?.vivienda_id);
    console.log("=====================================");
  }, [user, token]);

  const registrarVisita = async () => {
    console.log("Token being used:", token); // ✅ Ahora debería tener valor
    
    // ✅ Validación adicional
    if (!token) {
      Alert.alert("Error", "No se encontró token de autenticación. Por favor, inicia sesión nuevamente.");
      return;
    }
    
    if (!user?.vivienda_id) {
      Alert.alert("Error", "No se encontró información de vivienda. Por favor, contacta al administrador.");
      return;
    }

    try {
      setLoading(true);
      console.log("Enviando solicitud con token:", token);
      
      const response = await fetch(`${API_BASE}/accesos/api/visitas/crear/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_visitante: nombre,
          documento_visitante: documento,
          vivienda_destino_id: user.vivienda_id,
          motivo: motivo,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        console.log("Error desde backend:", data);
        Alert.alert("Error", data.error || "Algo salió mal.");
        return;
      }

      console.log("Visita registrada exitosamente:", data);
      setQrBase64(data.qr_base64);
    } catch (error) {
      setLoading(false);
      console.log("Excepción al registrar visita:", error);
      Alert.alert("Error", "No se pudo registrar la visita.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Nombre del visitante:</Text>
      <TextInput 
        style={styles.input} 
        value={nombre} 
        onChangeText={setNombre} 
        placeholder="Ej: Carlos Pérez" 
      />

      <Text style={styles.label}>Documento:</Text>
      <TextInput 
        style={styles.input} 
        value={documento} 
        onChangeText={setDocumento} 
        placeholder="Ej: 12345678" 
      />

      <Text style={styles.label}>Motivo:</Text>
      <TextInput 
        style={styles.input} 
        value={motivo} 
        onChangeText={setMotivo} 
        placeholder="Ej: Reunión familiar" 
      />

      <Button 
        title={loading ? "Enviando..." : "Generar QR"} 
        onPress={registrarVisita} 
        disabled={loading} 
      />

      {qrBase64 && (
        <View style={styles.qrContainer}>
          <Text style={styles.label}>Código QR generado:</Text>
          <Image
            source={{ uri: `data:image/png;base64,${qrBase64}` }}
            style={styles.qr}
            resizeMode="contain"
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'stretch',
    backgroundColor: 'white',
    flexGrow: 1,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    fontSize: 16,
    color: COLORS.black,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#f2f2f2',
  },
  qrContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  qr: {
    width: 200,
    height: 200,
    marginTop: 10,
  },
});