// navigation/StackNavigator.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import HabitantesScreen from "../screens/HabitantesScreen";
import VisitantesScreen from "../screens/VisitantesScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import AreasComunesScreen from "../screens/AreasComunesScreen";

const Stack = createStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Habitantes" component={HabitantesScreen} />
      <Stack.Screen name="Visitantes" component={VisitantesScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="AreasComunes" component={AreasComunesScreen} />


    
    </Stack.Navigator>
  );
}