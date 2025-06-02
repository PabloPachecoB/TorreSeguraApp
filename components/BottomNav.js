// components/BottomNav.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigationContext } from "../context/NavigationContext";
import { COLORS, SIZES } from "../constants";

export default function BottomNav({ navigation, role, username }) {
  const { selectedTab, setSelectedTab } = useNavigationContext();

  const handleHomeTab = () => {
    setSelectedTab("home");
    navigation.navigate("Home", { username, role });
  };

  const handleNotificationsTab = () => {
    setSelectedTab("notifications");
    navigation.navigate("Notifications");
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[
          styles.navButton,
          selectedTab === "home" && { backgroundColor: COLORS.primary },
        ]}
        onPress={handleHomeTab}
      >
        <Icon
          name="home-outline"
          size={SIZES.iconSize}
          color={selectedTab === "home" ? COLORS.white : COLORS.black}
        />
        <Text
          style={[
            styles.navText,
            selectedTab === "home" && { color: COLORS.white },
            selectedTab === "home" && { fontFamily: "Roboto-Bold" },
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.navButton,
          selectedTab === "notifications" && { backgroundColor: COLORS.primary },
        ]}
        onPress={handleNotificationsTab}
      >
        <Icon
          name="notifications-outline"
          size={SIZES.iconSize}
          color={selectedTab === "notifications" ? COLORS.white : COLORS.black}
        />
        <Text
          style={[
            styles.navText,
            selectedTab === "notifications" && { color: COLORS.white },
            selectedTab === "notifications" && { fontFamily: "Roboto-Bold" },
          ]}
        >
          Notificaciones
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
   position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  navButton: {
    flex: 1, // Cada botón ocupa el mismo espacio
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: SIZES.borderRadius,
    marginHorizontal: 10
  },
  navText: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular", // Por defecto usamos Roboto-Regular
    color: COLORS.black,
    marginTop: 5,
  },
});