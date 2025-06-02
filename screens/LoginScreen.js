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
useEffect(() => {
  const tryBiometricLogin = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      setCheckingBiometrics(false);
      return;
    }

    const result = await Promise.race([
      LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación facial',
        fallbackLabel: 'Usar contraseña',
        cancelLabel: 'Cancelar',
      }),
      new Promise(resolve => setTimeout(() => resolve({ success: false }), 10000))
    ]);

    if (result.success) {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          await saveUser(parsedUser);

          if (parsedUser.role === ROLE_VIGILANTE) {
            navigation.replace("Visitantes");
          } else if (parsedUser.role === ROLE_RESIDENTE) {
            navigation.replace("Home");
          } else {
            setErrorMsg("Rol no válido.");
          }
          return;
        } else {
          setErrorMsg("No hay usuario guardado.");
        }
      } catch (e) {
        setErrorMsg("Error al recuperar usuario guardado.");
      }
    }

    setCheckingBiometrics(false); // Mostrar formulario manual si falla
  };

  tryBiometricLogin();
}, []);


  
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
              placeholder="Usuario del sistema"
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
