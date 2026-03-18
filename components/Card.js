// components/Card.js
import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import { COLORS, SIZES } from "../constants";

const MENU_ICONS = {
  "QR o Pass": "qr-code-outline",
  Habitantes: "people",
  Visitantes: "person-outline",
  "Mis Visitantes": "person-outline",
  "Lista Total": "list",
  "Áreas Comunes": "home-outline",
  Alertas: "warning",
  Solicitudes: "notifications-outline",
  Invitaciones: "mail",
  Pagos: "card-outline",
  Reportes: "analytics",
  Configuración: "settings",
};

export default function Card({ title, number, color, hasWarning, onPress }) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const shadowValue = useRef(new Animated.Value(3)).current;
  const iconName = MENU_ICONS[title] || "home-outline";

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.98,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.timing(shadowValue, {
        toValue: 8,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.timing(shadowValue, {
        toValue: 3,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: scaleValue }],
          shadowOpacity: shadowValue.interpolate({
            inputRange: [3, 8],
            outputRange: [0.1, 0.2],
          }),
          shadowRadius: shadowValue,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.menuIconContainer}>
          <Icon name={iconName} size={20} color={COLORS.black} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={[styles.numberCircle, { backgroundColor: color }]}>
          <Text style={styles.number}>{number}</Text>
          {hasWarning && (
            <View style={styles.warningBadge}>
              <Icon name="warning" size={12} color="#FFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: "48%",
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    width: "100%",
    padding: 12,
    borderRadius: SIZES.borderRadius,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 90,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: Math.min(SIZES.fontSizeSubtitle, 14),
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 10,
    textAlign: "center",
  },
  numberCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  number: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.white,
  },
  warningBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});