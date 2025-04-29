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
      alert(error.message);
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
          {selectedTab === "forgot" ? "RECUPERAR CONTRASEÑA" : "BIENVENIDO A TORRE SEGURA"}
        </Text>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Icon name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              placeholder="Username"
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
                placeholder="Password"
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
              {loading ? "CARGANDO..." : selectedTab === "forgot" ? "RECUPERAR" : "NEXT"}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.aboutUsButton} onPress={handleAboutUs}>
          <Text style={styles.aboutUsText}>About Us</Text>
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
            <Text style={styles.tabText}>Registrate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "forgot" ? styles.activeTab : styles.inactiveTab,
            ]}
            onPress={handleForgotPassword}
          >
            <Icon name="lock-closed-outline" size={20} color={COLORS.white} style={styles.tabIcon} />
            <Text style={styles.tabText}>¿Recuperar contraseña?</Text>
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