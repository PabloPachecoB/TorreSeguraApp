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
    navigation.navigate("Home", { username, role }); // Pasa username y role al navegar
  };

  const handleNotificationsTab = () => {
    setSelectedTab("notifications");
    navigation.navigate("Notifications");
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[styles.navButton, selectedTab === "home" && { backgroundColor: COLORS.primary }]}
        onPress={handleHomeTab}
      >
        <Icon
          name="home-outline"
          size={SIZES.iconSize}
          color={selectedTab === "home" ? COLORS.white : COLORS.black}
        />
        <Text
          style={[styles.navText, selectedTab === "home" && { color: COLORS.white }]}
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
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navButton: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.borderRadius,
  },
  navText: {
    fontSize: SIZES.fontSizeSmall,
    color: COLORS.black,
    marginTop: 5,
  },
});