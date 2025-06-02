import { StatusBar } from "expo-status-bar";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { NavigationProvider } from "./context/NavigationContext";
import { UserProvider } from "./context/UserContext";
import StackNavigator from "./navigation/StackNavigator";
import * as SplashScreen from "expo-splash-screen";
import { useState, useEffect } from "react";
import { loadFonts } from "./hooks/useFonts";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadResources = async () => {
      try {
        await loadFonts();
        setFontsLoaded(true);
      } catch (e) {
        console.warn(e);
      } finally {
        SplashScreen.hideAsync();
      }
    };
    loadResources();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <NavigationProvider>
          <NavigationContainer>
            <StackNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </NavigationProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
