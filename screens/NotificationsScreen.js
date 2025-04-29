// screens/NotificationsScreen.js
import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { COLORS, SIZES } from "../constants";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";

export default function NotificationsScreen({ navigation }) {
  const { selectedTab } = useNavigationContext();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Notificaciones</Text>
      <Text style={styles.message}>No hay notificaciones por ahora.</Text>
      <BottomNav selectedTab={selectedTab} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  title: {
    fontSize: SIZES.fontSizeTitle, // Tamaño para títulos
    fontFamily: "Roboto-Bold", // Título principal
    fontWeight: "bold",
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 20,
  },
  message: {
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Regular", // Texto normal
    color: COLORS.gray,
    textAlign: "center",
  },
});