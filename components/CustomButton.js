// components/CustomButton.js
import React, { useRef } from "react";
import { TouchableOpacity, Text, StyleSheet, Animated, View, ActivityIndicator } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
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
  fontSize = SIZES.fontSizeBody,
  icon,
  iconSize = 20,
  loading = false,
  disabled = false,
  variant = "primary", // primary, secondary, outline
}) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const shadowValue = useRef(new Animated.Value(3)).current;

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 0.95,
          friction: 6,
          useNativeDriver: false,
        }),
        Animated.timing(shadowValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        useNativeDriver: false,
      }),
      Animated.timing(shadowValue, {
        toValue: 3,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const getButtonStyle = () => {
    let bgColor = defaultColor;
    let borderWidth = 0;
    let borderColor = "transparent";

    if (variant === "outline") {
      bgColor = "transparent";
      borderWidth = 2;
      borderColor = defaultColor;
    }

    return {
      backgroundColor: disabled ? COLORS.disabled || "#ccc" : bgColor,
      opacity: disabled ? 0.6 : 1,
      borderWidth,
      borderColor,
    };
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }],
          shadowOpacity: shadowValue.interpolate({
            inputRange: [1, 3],
            outputRange: [0.05, 0.15],
          }),
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          getButtonStyle(),
          {
            width,
            height,
            borderRadius,
          },
        ]}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <View style={styles.contentContainer}>
            {icon && (
              <Icon
                name={icon}
                size={iconSize}
                color={variant === "outline" ? defaultColor : textColor}
                style={text ? styles.iconWithText : styles.iconAlone}
              />
            )}
            {text && (
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: variant === "outline" ? defaultColor : textColor,
                    fontSize,
                  },
                ]}
              >
                {text}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  iconWithText: {
    marginRight: 8,
  },
  iconAlone: {
    margin: 0,
  },
});