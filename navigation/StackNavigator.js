// navigation/StackNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import AreasComunesScreen from "../screens/AreasComunesScreen";
import HabitantesScreen from "../screens/HabitantesScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import VisitantesScreen from "../screens/VisitantesScreen";
import QRCodeScreen from "../screens/QRCodeScreen";
import InvitationScreen from "../screens/InvitationScreen";
import AlertScreen from "../screens/AlertaScreen";
import PaymentScreen from "../screens/PaymentScreen";
import ListaTotalScreen from '../screens/ListaTotalScreen'
import WelcomeScreen from "../screens/WelcomeScreen";
import VisitRequestScreen from '../screens/VisitRequestScreen';
import ChatScreen from "../screens/ChatScreen";
import PuertasScreen from "../screens/PuertasScreen";


const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AreasComunes" component={AreasComunesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Habitantes" component={HabitantesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Visitantes" component={VisitantesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="QRCode" component={QRCodeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="InvitationScreen" component={InvitationScreen} options={{headerShown: false}} />
      <Stack.Screen name="AlertScreen" component={AlertScreen} options={{headerShown: false}} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} options={{headerShown: false}}/>
      <Stack.Screen name="ListaTotalScreen" component={ListaTotalScreen} options={{headerShown: false}}/>
      <Stack.Screen name="VisitRequest" component={VisitRequestScreen} options={{headerShown: false}} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Puertas" component={PuertasScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
  );
}