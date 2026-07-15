// components/MainLayout.js
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import BottomNav from "./BottomNav";
import FloatingChatButton from "./FloatingChatButton";
import { COLORS } from "../constants";

export default function MainLayout({ children, navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {children}
      <FloatingChatButton navigation={navigation} />
      <BottomNav navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});