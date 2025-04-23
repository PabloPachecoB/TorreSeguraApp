// screens/HomeScreen.js
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Card from "../components/Card";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import { getMenuByRole } from "../services/menuService";
import MainLayout from "../components/MainLayout";

export default function HomeScreen({ navigation }) {
  console.log("Renderizando HomeScreen...");

  const { user, logout } = useUserContext();
  const { selectedTab } = useNavigationContext();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("Usuario en HomeScreen:", user);

  const username = user?.username || "Usuario";
  const role = user?.role || user?.rol?.nombre || "Rol";

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Cargando menú para el rol:", role);
        const menu = await getMenuByRole(role);
        console.log("Menú cargado:", menu);
        setMenuItems(menu);
      } catch (err) {
        console.error("Error al cargar el menú:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [role]);

  const handleCardPress = useCallback((title) => {
    console.log("Presionando tarjeta:", title);
    switch (title) {
      case "Habitantes":
        navigation.navigate("Habitantes");
        break;
      case "Visitantes":
      case "Mis Visitantes":
        navigation.navigate("Visitantes", { role });
        break;
      case "Alertas":
        navigation.navigate("Notifications");
        break;
      case "Áreas Comunes": // Nuevo caso para Áreas Comunes
        navigation.navigate("AreasComunes");
        break;
      default:
        alert(`Funcionalidad para "${title}" aún no implementada`);
    }
  }, [navigation, role]);

  const handleLogout = useCallback(() => {
    console.log("Cerrando sesión desde HomeScreen...");
    logout();
    navigation.replace("Login");
  }, [logout, navigation]);
  
  useEffect(() => {
    if (!user || !user.username || !(user.role || user.rol?.nombre)) {
      console.log("Usuario no válido, redirigiendo a Login...");
      navigation.replace("Login");
    }
  }, [user]);

  if (loading) {
    console.log("Mostrando pantalla de carga...");
    return (
      <MainLayout navigation={navigation}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </MainLayout>
    );
  }

  if (error) {
    console.log("Mostrando pantalla de error:", error);
    return (
      <MainLayout navigation={navigation}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </MainLayout>
    );
  }

  console.log("Renderizando contenido principal de HomeScreen...");
  return (
    <MainLayout navigation={navigation}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="person-circle-outline" size={40} color={COLORS.black} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{username}</Text>
            <Text style={styles.headerSubtitle}>{role}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
            <Icon name="notifications-outline" size={30} color={COLORS.black} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Icon name="log-out-outline" size={30} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.cardsContainer}>
          {menuItems.map((item, index) => (
            <Card
              key={index}
              title={item.title}
              number={item.number}
              color={item.color}
              hasWarning={item.hasWarning}
              onPress={() => handleCardPress(item.title)}
            />
          ))}
        </View>
      </View>
    </MainLayout>
  );
}








const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: SIZES.fontSizeLarge,
    fontWeight: "bold",
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: SIZES.fontSizeSmall,
    color: COLORS.gray,
  },
  icon: {
    marginRight: 15,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  loadingText: {
    flex: 1,
    textAlign: "center",
    marginTop: 50,
    fontSize: SIZES.fontSizeLarge,
    color: COLORS.black,
  },
  errorText: {
    flex: 1,
    textAlign: "center",
    marginTop: 50,
    fontSize: SIZES.fontSizeLarge,
    color: COLORS.error,
  },
  logoutText: {
    textAlign: "center",
    fontSize: SIZES.fontSizeMedium,
    color: COLORS.primary,
    marginTop: 20,
  },
});