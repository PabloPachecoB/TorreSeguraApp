// components/BottomNav.js
import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import { useNavigationContext } from "../context/NavigationContext";
import { COLORS, SIZES } from "../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  {
    id: "home",
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
    action: (navigation, { username, role }) => navigation.navigate("Home", { username, role }),
  },
  {
    id: "notifications",
    label: "Notificaciones",
    icon: "notifications-outline",
    activeIcon: "notifications",
    action: (navigation) => navigation.navigate("Notifications"),
  },
];

export default function BottomNav({ navigation, role, username }) {
  const { selectedTab, setSelectedTab } = useNavigationContext();
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab) => {
    setSelectedTab(tab.id);
    tab.action(navigation, { username, role });
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
      {TABS.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={selectedTab === tab.id}
          onPress={() => handleTabPress(tab)}
        />
      ))}
    </View>
  );
}

function TabButton({ tab, isActive, onPress }) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.95,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.tabButtonContainer,
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.navButton,
          isActive && styles.navButtonActive,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Icon
          name={isActive ? tab.activeIcon : tab.icon}
          size={SIZES.iconSize}
          color={isActive ? COLORS.white : COLORS.black}
        />
        <Text
          style={[
            styles.navText,
            isActive && styles.navTextActive,
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  tabButtonContainer: {
    flex: 1,
    alignItems: "center",
  },
  navButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: SIZES.borderRadius,
    marginHorizontal: 4,
    flexDirection: "row",
  },
  navButtonActive: {
    backgroundColor: COLORS.primary,
  },
  navText: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginLeft: 6,
  },
  navTextActive: {
    color: COLORS.white,
    fontFamily: "Roboto-Bold",
  },
});