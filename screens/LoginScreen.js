// screens/LoginScreen.js
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import LottieView from "lottie-react-native";
import { login } from "../services/authService";
import { useUserContext } from "../context/UserContext";
import { users } from "../utils/users";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [selectedTab, setSelectedTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const { saveUser, user } = useUserContext();

  // Redirigir a Home si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      console.log("Usuario ya autenticado, redirigiendo a Home...");
      navigation.navigate("Home");
    }
  }, [user, navigation]);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      console.log("Iniciando proceso de login...");
      console.log("Intentando iniciar sesión con:", { username, password });
      const userData = await login(username, password);
      console.log("Usuario encontrado:", userData);
      console.log("Guardando usuario...");
      await saveUser({
        username: userData.username,
        role: userData.role,
        token: userData.token,
      });
      console.log("Usuario guardado, navegando a Home...");
      navigation.navigate("Home");
      console.log("Después de navigation.navigate en handleLogin");
    } catch (error) {
      console.error("Error en login:", error.message);
      alert(error.message);
    } finally {
      setLoading(false);
      console.log("Proceso de login finalizado, loading set to false");
    }
  }, [username, password, loading, saveUser, navigation]);

  const handleLoginTab = () => {
    setSelectedTab("login");
    setUsername("");
    setPassword("");
  };

  const handleForgotPassword = () => {
    setSelectedTab("forgot");
  };

  const handleRecoverPassword = () => {
    if (!username) {
      alert("Por favor, ingresa tu nombre de usuario.");
      return;
    }

    const user = users.find((u) => u.username === username);
    if (user) {
      alert(`Tu contraseña es: ${user.password}`);
    } else {
      alert("Usuario no encontrado. Verifica tu nombre de usuario.");
    }
  };

  const handleAboutUs = () => {
    alert("Funcionalidad de About Us aún no implementada");
  };

  return (
    <ImageBackground
      source={require("../assets/Fondo_Log.jpg")}
      style={{ flex: 1, width: "100%", height: "100%" }}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
          backgroundColor: "rgba(244, 200, 200, 0.43)",
        }}
      >
        <Image
          source={require("../assets/logoSmall.png")}
          style={{
            width: 120,
            height: 120,
            marginBottom: 20,
          }}
          resizeMode="contain"
        />
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 26,
            fontWeight: "bold",
            marginBottom: 20,
          }}
        >
          {selectedTab === "forgot" ? "RECUPERAR CONTRASEÑA" : "BIENVENIDO A TORRE SEGURA"}
        </Text>
        <View style={{ width: "100%", marginBottom: 30 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#333333",
              padding: 15,
              borderRadius: 12,
              marginBottom: 15,
              borderWidth: 1,
              borderColor: "#444",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
            }}
          >
            <Icon name="person-outline" size={20} color="#999" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Username"
              placeholderTextColor="#999"
              style={{ flex: 1, color: "#FFF" }}
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />
          </View>
          {selectedTab === "login" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#333333",
                padding: 15,
                borderRadius: 12,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "#444",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 2,
              }}
            >
              <Icon name="lock-closed-outline" size={20} color="#999" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={secureText}
                style={{ flex: 1, color: "#FFF" }}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <Icon name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={{
              backgroundColor: "#00FF00",
              padding: 15,
              borderRadius: 25,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 5,
              elevation: 3,
              opacity: loading ? 0.6 : 1,
            }}
            activeOpacity={0.7}
            onPress={selectedTab === "forgot" ? handleRecoverPassword : handleLogin}
            disabled={loading}
          >
            <Text
              style={{
                textAlign: "center",
                color: "#000",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {loading ? "CARGANDO..." : selectedTab === "forgot" ? "RECUPERAR" : "NEXT"}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: "#1A1A1A",
            paddingVertical: 10,
            paddingHorizontal: 30,
            borderRadius: 20,
            marginBottom: 40,
          }}
          onPress={handleAboutUs}
        >
          <Text
            style={{
              textAlign: "center",
              color: "#FFF",
              fontSize: 14,
            }}
          >
            About Us
          </Text>
        </TouchableOpacity>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            paddingHorizontal: 20,
            marginBottom: 20,
            backgroundColor: "transparent",
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selectedTab === "login" ? "#00FF00" : "#003366",
              paddingVertical: 15,  
              borderTopLeftRadius: 25,
              borderBottomLeftRadius: 25,
            }}
            onPress={handleLoginTab}
          >
            <Icon name="person-outline" size={20} color="#FFF" style={{ marginRight: 5 }} />
            <Text
              style={{
                color: "#FFF",
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              Registrate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selectedTab === "forgot" ? "#00FF00" : "#003366",
              paddingVertical: 15,
              borderTopRightRadius: 25,
              borderBottomRightRadius: 25,
            }}
            onPress={handleForgotPassword}
          >
            <Icon name="lock-closed-outline" size={20} color="#FFF" style={{ marginRight: 5 }} />
            <Text
              style={{
                color: "#FFF",
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              ¿Recuperar contraseña?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}