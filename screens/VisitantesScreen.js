// screens/VisitantesScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { COLORS, SIZES } from "../constants";

const initialVisitantes = [
  { id: "1", name: "Ana Martínez", document: "98765432", date: "2025-03-23", purpose: "Visita familiar" },
  { id: "2", name: "Luis Rodríguez", document: "45678912", date: "2025-03-23", purpose: "Entrega" },
];

export default function VisitantesScreen({ navigation, route }) {
  const role = route.params?.role || "portero";
  const { selectedTab } = useNavigationContext();
  const [visitantes, setVisitantes] = useState(initialVisitantes);
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [date, setDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleAddVisitante = () => {
    if (name && document && date && purpose) {
      const newVisitante = {
        id: (visitantes.length + 1).toString(),
        name,
        document,
        date,
        purpose,
      };
      setVisitantes([...visitantes, newVisitante]);
      setName("");
      setDocument("");
      setDate("");
      setPurpose("");
      setShowForm(false);
    } else {
      alert("Por favor, completa todos los campos");
    }
  };

  const renderVisitante = ({ item }) => (
    <View style={styles.visitanteItem}>
      <Text style={styles.visitanteText}>Nombre: {item.name}</Text>
      <Text style={styles.visitanteText}>Documento: {item.document}</Text>
      <Text style={styles.visitanteText}>Fecha: {item.date}</Text>
      <Text style={styles.visitanteText}>Propósito: {item.purpose}</Text>
      <TouchableOpacity style={styles.qrButton} onPress={() => navigation.navigate("QRCode")}>
        <Text style={styles.qrButtonText}>Ver QR</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {role === "propietario" ? "Mis Visitantes" : "Visitantes"}
        </Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Icon
            name={showForm ? "close-outline" : "add-outline"}
            size={30}
            color={COLORS.black}
          />
        </TouchableOpacity>
      </View>
      {showForm && (
        <View style={styles.form}>
          <TextInput
            placeholder="Nombre"
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Documento"
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={document}
            onChangeText={setDocument}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Fecha (YYYY-MM-DD)"
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={date}
            onChangeText={setDate}
          />
          <TextInput
            placeholder="Propósito de la visita"
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={purpose}
            onChangeText={setPurpose}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddVisitante}>
            <Text style={styles.addButtonText}>Agregar Visitante</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={visitantes}
        renderItem={renderVisitante}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <BottomNav selectedTab={selectedTab} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.fontSizeTitle, // Tamaño para títulos
    fontFamily: "Roboto-Bold", // Título principal
    fontWeight: "bold",
    color: COLORS.black,
  },
  form: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.margin,
    borderRadius: SIZES.borderRadius,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: SIZES.margin,
  },
  input: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    color: COLORS.black,
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Regular", // Texto normal
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Bold", // Texto destacado
    fontWeight: "bold",
  },
  list: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  visitanteItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  visitanteText: {
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Regular", // Texto normal
    color: COLORS.black,
  },
  qrButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
  },
  qrButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Regular", // Texto normal
    fontWeight: "bold",
  },
});