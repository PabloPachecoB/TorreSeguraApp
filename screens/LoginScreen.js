import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  StyleSheet,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import { login } from "../services/authService";
import { useUserContext } from "../context/UserContext";
import { users } from "../utils/users";
import { COLORS, SIZES } from "../constants";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [selectedTab, setSelectedTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const { saveUser, user } = useUserContext();

  useEffect(() => {
    if (user) {
      navigation.navigate("Home");
    }
  }, [user, navigation]);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const userData = await login(username, password);
      await saveUser({
        username: userData.username,
        role: userData.role,
        token: userData.token,
      });
      navigation.navigate("Home");
    } catch (error) {
      alert(error.message || "Error al iniciar sesión. Verifica tus credenciales o la conexión.");
    } finally {
      setLoading(false);
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
      alert("Por favor, ingresa tu usuario del sistema de seguridad.");
      return;
    }

    const user = users.find((u) => u.username === username);
    if (user) {
      alert(`Tu contraseña es: ${user.password}`);
    } else {
      alert("Usuario no encontrado. Verifica tu usuario del sistema.");
    }
  };

  const handleAboutUs = () => {
    alert("Torre Segura: Sistema de gestión de seguridad para condominios.");
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
        <Text style={styles.title}>
          {selectedTab === "forgot" ? "RECUPERAR CONTRASEÑA" : "ACCESO A TORRE SEGURA"}
        </Text>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Icon name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              placeholder="Usuario del sistema"
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />
          </View>
          {selectedTab === "login" && (
            <View style={styles.inputWrapper}>
              <Icon name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor={COLORS.gray}
                secureTextEntry={secureText}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <Icon
                  name={secureText ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={[styles.submitButton, { opacity: loading ? 0.6 : 1 }]}
            activeOpacity={0.7}
            onPress={selectedTab === "forgot" ? handleRecoverPassword : handleLogin}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "CARGANDO..." : selectedTab === "forgot" ? "RECUPERAR" : "INGRESAR"}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.aboutUsButton} onPress={handleAboutUs}>
          <Text style={styles.aboutUsText}>Sobre Torre Segura</Text>
        </TouchableOpacity>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "login" ? styles.activeTab : styles.inactiveTab,
            ]}
            onPress={handleLoginTab}
          >
            <Icon name="person-outline" size={20} color={COLORS.white} style={styles.tabIcon} />
            <Text style={styles.tabText}>Iniciar Sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "forgot" ? styles.activeTab : styles.inactiveTab,
            ]}
            onPress={handleForgotPassword}
          >
            <Icon name="lock-closed-outline" size={20} color={COLORS.white} style={styles.tabIcon} />
            <Text style={styles.tabText}>Recuperar Contraseña</Text>
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
    backgroundColor: "rgba(0, 51, 102, 0.5)", // Fondo azul oscuro para seguridad
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 25,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeTitle,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 35,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A", // Fondo oscuro para inputs
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#4A4A4A",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
  },
  submitButton: {
    backgroundColor: "#00A300", // Verde oscuro para seguridad
    padding: 15,
    borderRadius: 25,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonText: {
    textAlign: "center",
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  aboutUsButton: {
    backgroundColor: "#1A3C66", // Azul oscuro para profesionalismo
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 20,
    marginBottom: 45,
  },
  aboutUsText: {
    textAlign: "center",
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
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
    backgroundColor: "#00A300", // Verde para pestaña activa
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
  },
  inactiveTab: {
    backgroundColor: "#1A3C66", // Azul oscuro para pestaña inactiva
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  tabIcon: {
    marginRight: 5,
  },
  tabText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    fontWeight: "bold",
  },
});