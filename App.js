import { StatusBar } from "expo-status-bar";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { NavigationProvider } from "./context/NavigationContext";
import { UserProvider } from "./context/UserContext";
import StackNavigator from "./navigation/StackNavigator";

export default function App() {
  return (
    <UserProvider>
      <NavigationProvider>
        <NavigationContainer>
          <StackNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </NavigationProvider>
    </UserProvider>
  );
}