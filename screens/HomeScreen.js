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
  const { user, logout } = useUserContext();
  const { selectedTab } = useNavigationContext();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const username = user?.username || "Usuario";
  const role = user?.role || "Rol";

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const menu = await getMenuByRole(role);
        setMenuItems(menu);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [role]);

  const handleCardPress = useCallback((title) => {
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
      case "Áreas Comunes":
        navigation.navigate("AreasComunes");
        break;
      case "QR o Pass": // Añadimos el caso para "QR o Pass"
        navigation.navigate("QRCode");
        break;
      default:
        alert(`Funcionalidad para "${title}" aún no implementada`);
    }
  }, [navigation, role]);

  const handleLogout = useCallback(() => {
    logout();
    navigation.replace("Login");
  }, [logout, navigation]);

  if (!user || !user.username || !user.role) {
    navigation.replace("Login");
    return null;
  }

  if (loading) {
    return (
      <MainLayout navigation={navigation}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout navigation={navigation}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </MainLayout>
    );
  }

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
            <Icon name="notifications-outline" size={SIZES.iconSize} color={COLORS.black} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Icon name="log-out-outline" size={SIZES.iconSize} color={COLORS.black} />
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
    fontSize: SIZES.fontSizeTitle,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
  },
  icon: {
    marginRight: 15,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
    paddingBottom: 100,
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
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
  },
  errorText: {
    flex: 1,
    textAlign: "center",
    marginTop: 50,
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Regular",
    color: COLORS.error,
  },
  logoutText: {
    textAlign: "center",
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.primary,
    marginTop: 20,
  },
});