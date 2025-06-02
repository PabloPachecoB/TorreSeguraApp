import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import { SIZES } from "../constants/sizes";

const MyButton = ({ text, onPress, disabled = false, variant = "default" }) => {
  const backgroundColors = {
    default: COLORS.primary,
    disabled: COLORS.gray,
    pregunta: "#8B5CF6",
    cuento: "#6B21A8",
    success: COLORS.success,
    danger: COLORS.error,
  };

  const finalBackgroundColor =
    disabled ? backgroundColors["disabled"] : backgroundColors[variant] || backgroundColors["default"];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: finalBackgroundColor,
          opacity: disabled ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: SIZES.borderRadius,
    alignItems: "center",
    marginTop: SIZES.margin / 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  text: {
    color: COLORS.primary,
    fontSize: SIZES.fontSizeSubtitle,
    fontWeight: "bold",
    fontFamily: "Roboto-Bold",
  },
});

export default MyButton;
