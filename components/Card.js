// components/Card.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { COLORS, SIZES } from "../constants";

export default function Card({ title, number, color, hasWarning, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, title === "Alertas" && { width: "48%" }]}
      onPress={onPress}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={[styles.numberCircle, { backgroundColor: color }]}>
        <Text style={styles.number}>{number}</Text>
        {hasWarning && (
          <Icon name="warning" size={16} color="#FFF" style={styles.warningIcon} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    width: "48%",
    padding: 15,
    borderRadius: SIZES.borderRadius,
    marginBottom: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: SIZES.fontSizeSubtitle, // Tamaño para subtítulos
    fontFamily: "Roboto-Medium", // Subtítulo
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 10,
  },
  numberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  number: {
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Bold", // Texto destacado
    fontWeight: "bold",
    color: COLORS.white,
  },
  warningIcon: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    padding: 2,
  },
});