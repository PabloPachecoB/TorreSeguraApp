import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import MyButton from "./MyButton";
import { CheckIcon, CheckIconfail } from "./Icons";
import {COLORS} from "../constants/colors"
import { SIZES } from "../constants/sizes";

const { width } = Dimensions.get("window");

const CustomAlert = ({
  visible,
  onClose,
  title = "¡Éxito!",
  message = "Operación completada.",
  success = true,
  primaryButtonText = "Aceptar",
  onPrimaryPress,
  secondaryButtonText,
  onSecondaryPress,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.icon}>
            {success ? (
              <CheckIcon size={50} color={COLORS.success} />
            ) : (
              <CheckIconfail size={50} color={COLORS.error} />
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <MyButton
            text={primaryButtonText}
            onPress={onPrimaryPress || onClose}
            backgroundColor={success ? COLORS.success : COLORS.error}
            textColor={COLORS.primary}
          />

          {secondaryButtonText && (
            <Pressable
              style={styles.secondaryButton}
              onPress={onSecondaryPress || onClose}
            >
              <Text style={styles.secondaryText}>{secondaryButtonText}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.8,
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.borderRadius,
    alignItems: "center",
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  icon: {
    marginBottom: SIZES.margin / 2,
  },
  title: {
    fontSize: SIZES.fontSizeTitle,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SIZES.margin / 2,
    textAlign: "center",
  },
  message: {
    fontSize: SIZES.fontSizeSubtitle,
    color: COLORS.gray,
    marginBottom: SIZES.margin,
    textAlign: "center",
  },
  secondaryButton: {
    marginTop: SIZES.margin / 2,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  secondaryText: {
    color: COLORS.secondary,
    fontSize: SIZES.fontSizeBody,
    fontWeight: "600",
  },
});
