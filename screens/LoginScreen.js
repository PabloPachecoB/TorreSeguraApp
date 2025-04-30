// screens/LoginScreen.js
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  StyleSheet,
} from "react-native";
import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import { login } from "../services/authService";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";

const ROLE_VIGILANTE = "Vigilante";
const ROLE_RESIDENTE = "Residente"
export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { saveUser, user } = useUserContext();

  // useEffect(() => {
  //   if (user && user.username && user.role) {
  //     if (user.role === "Vigilante") {
  //       navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  //     } else {
  //       navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  //     }
  //   }
  // }, [user]);


  const handleLogin = async () => {
    setErrorMsg("");

    if (username.trim() === "" || password.trim() === "") {
      setErrorMsg("Completa ambos campos para iniciar sesión.");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {

      const sanitizedUsername = username.trim().toLowerCase();
      const userData = await login(sanitizedUsername, password);


      await saveUser({
        username: userData.username,
        role: userData.rol.nombre,
        rol: userData.rol,
        token: userData.token,
      });

      if (userData.rol.nombre === ROLE_VIGILANTE) {
        navigation.replace("Visitantes");
        return;
      } else if (userData.rol.nombre === ROLE_RESIDENTE) {
        navigation.replace("Home");
        return;
      }
    } catch (error) {
      // console.error("Error en login:", error.message);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/Fondo_Log.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <View style={styles.container}>
        <Image
          source={require("../assets/logoSmall.png")}
          style={styles.logo}
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
          BIENVENIDO A TORRE SEGURA
        </Text>
        <View style={{ width: "100%", marginBottom: 10 }}>
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
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />
          </View>

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

          {errorMsg.length > 0 && (
            <View
              style={{
                backgroundColor: "#ed6464",
                borderColor: "#b02a2a",
                borderWidth: 1.5,
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#FFF", textAlign: "center", fontWeight: "600" }}>
                {errorMsg}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => { }}
            style={{ marginTop: -10 }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: "#FFFFF",
                fontSize: 14,
                textDecorationLine: "underline",
                fontWeight: "500",
                marginTop: 15,
              }}
            >
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

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
              marginTop: 20,
            }}
            activeOpacity={0.7}
            onPress={handleLogin}
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
              {loading ? "CARGANDO..." : "INICIAR SESIÓN"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(244, 200, 200, 0.43)",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeTitle, // Tamaño para títulos
    fontFamily: "Roboto-Bold", // Título principal
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#444",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Regular", // Texto normal
  },
  submitButton: {
    backgroundColor: "#00FF00",
    padding: 15,
    borderRadius: 25,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonText: {
    textAlign: "center",
    color: COLORS.black,
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Bold", // Texto destacado
    fontWeight: "bold",
  },
  aboutUsButton: {
    backgroundColor: "#1A1A1A",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 40,
  },
  aboutUsText: {
    textAlign: "center",
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Regular", // Texto normal
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.transparent,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  activeTab: {
    backgroundColor: "#00FF00",
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
  },
  inactiveTab: {
    backgroundColor: "#003366",
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  tabIcon: {
    marginRight: 5,
  },
  tabText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Regular", // Texto normal
    fontWeight: "bold",
  },
});
