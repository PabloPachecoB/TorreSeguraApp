// components/CustomButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../constants";

export default function CustomButton({
  onPress,
  text,
  defaultColor,
  activeColor,
  textColor,
  width,
  height,
  borderRadius,
  fontSize = SIZES.fontSizeBody, // Tamaño por defecto
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: defaultColor,
          width: width,
          height: height,
          borderRadius: borderRadius,
        },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: textColor,
            fontSize: fontSize,
          },
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Roboto-Bold", // Texto destacado
    fontWeight: "bold",
  },
});