// components/IconButton.js
import React from "react";
import { Pressable, StyleSheet } from "react-native";

const IconButton = ({ onPress, children, style, disabled = false }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.80 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

export default IconButton;