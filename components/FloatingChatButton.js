// components/FloatingChatButton.js
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import { COLORS } from "../constants";

export default function FloatingChatButton({ navigation }) {
  return (
    <TouchableOpacity
      style={styles.fab}
      activeOpacity={0.8}
      onPress={() => navigation.navigate("Chat")}
      accessibilityLabel="Abrir chat con el asistente"
    >
      <Icon name="chatbubble-ellipses" size={28} color={COLORS.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    // Por encima del BottomNav
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    // Sombra iOS
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Sombra Android
    elevation: 6,
    zIndex: 999,
  },
});
