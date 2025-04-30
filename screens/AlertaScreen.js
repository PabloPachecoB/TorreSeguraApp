// screens/AlertasScreen.js
import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { COLORS, SIZES } from "../constants";
