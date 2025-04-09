// components/Card.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

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
    backgroundColor: "#FFF",
    width: "48%",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
  warningIcon: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    padding: 2,
  },
});