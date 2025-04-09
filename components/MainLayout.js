// components/MainLayout.js
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import BottomNav from "./BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { COLORS } from "../constants";

export default function MainLayout({ children, navigation }) {
  const { selectedTab } = useNavigationContext();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {children}
      <BottomNav selectedTab={selectedTab} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});