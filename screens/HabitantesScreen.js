// screens/HabitantesScreen.js
import React from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { COLORS, SIZES } from "../constants";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";

const habitantes = [
  { id: "1", name: "Carlos Pérez", apartment: "101" },
  { id: "2", name: "Ana López", apartment: "102" },
  { id: "3", name: "Juan García", apartment: "201" },
];

export default function HabitantesScreen({ navigation }) {
  const { selectedTab } = useNavigationContext();

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.apartment}>Apartamento: {item.apartment}</Text>
      </View>
      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => navigation.navigate("QRCode")}
      >
        <Text style={styles.qrButtonText}>Ver QR</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Lista de Habitantes</Text>
      <FlatList
        data={habitantes}
        renderItem={renderItem}
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
  title: {
    fontSize: SIZES.fontSizeLarge,
    fontWeight: "bold",
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 20,
  },
  list: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 80, // Añadir padding inferior para que el BottomNav no tape el contenido
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  name: {
    fontSize: SIZES.fontSizeMedium,
    fontWeight: "bold",
    color: COLORS.black,
  },
  apartment: {
    fontSize: SIZES.fontSizeSmall,
    color: COLORS.gray,
  },
  qrButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
  },
  qrButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeSmall,
    fontWeight: "bold",
  },
});