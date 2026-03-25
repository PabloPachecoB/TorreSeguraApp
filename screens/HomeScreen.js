// screens/HomeScreen.js
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import Card from "../components/Card";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import { getMenuByRole } from "../services/menuService";
import MainLayout from "../components/MainLayout";
import IconButton from "../components/IconButton";
import { LogoutIcon } from "../components/Icons";
import CustomAlert from "../components/CustomAlert";

const MENU_ORDER = [
  "QR o Pass",
  "Habitantes",
  "Visitantes",
  "Mis Visitantes",
  "Historial Accesos",
  "Invitaciones",
  "Pagos",
  "Áreas Comunes",
  "Lista Total",
  "Reportes",
  "Configuración",
  "Alertas",
];

const sortMenuItems = (items) => {
  return [...items].sort((a, b) => {
    const indexA = MENU_ORDER.indexOf(a.title);
    const indexB = MENU_ORDER.indexOf(b.title);

    const safeIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const safeIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

    return safeIndexA - safeIndexB;
  });
};


export default function HomeScreen({ navigation }) {
  const { user, logout } = useUserContext();
  const { selectedTab, setSelectedTab } = useNavigationContext();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const username = user?.username || "Usuario";
  const role = user?.role || user?.rol?.nombre || "Rol";

  // Marcar tab "home" como activo al enfocar esta pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setSelectedTab("home");
    });
    return unsubscribe;
  }, [navigation, setSelectedTab]);

  useEffect(() => {
    if (!role) return;

    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const menu = await getMenuByRole(role);
        const orderedMenu = Array.isArray(menu) ? sortMenuItems(menu) : [];
        setMenuItems(orderedMenu);
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
      case "Historial Accesos":
        navigation.navigate("VisitRequest");
        break;

      case "Áreas Comunes":
        navigation.navigate("AreasComunes");
        break;

      case "QR o Pass": // Añadimos el caso para "QR o Pass"
        navigation.navigate("QRCode");
        break;

      case "Invitaciones": //inviyaciones formulario
        navigation.navigate("InvitationScreen");
        break;

      case "Alertas":
        navigation.navigate("AlertScreen");
        break;

      case "Pagos":
        navigation.navigate("PaymentScreen");
        break;

      case "Lista Total":
        navigation.navigate("ListaTotalScreen");
        break;

      default:
        alert(`Funcionalidad para "${title}" aún no implementada`);
    }
  }, [navigation, role]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setAlertSuccess(true);
      setAlertMessage("Sesión cerrada correctamente.");
      setAlertVisible(true);

    } catch (error) {
      setAlertSuccess(false);
      setAlertMessage("No se pudo cerrar sesión.");
      setAlertVisible(true);
    }
  }, [logout]);


  useEffect(() => {
    if (alertVisible) return;
    if (!user || !user.username || !(user.role || user.rol?.nombre)) {
      console.log("Usuario no válido, redirigiendo a Login...");
      navigation.replace("Login");
    }
  }, [user, alertVisible]);


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
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="person-circle-outline" size={40} color={COLORS.black} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{username}</Text>
              <Text style={styles.headerSubtitle}>{role}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <IconButton onPress={handleLogout}>
              <LogoutIcon size={35} color={COLORS.black} />
            </IconButton>
          </View>

        </View>
        <View style={styles.content}>
          <View style={styles.cardsContainer}>
            {menuItems && Array.isArray(menuItems) && menuItems.map((item, index) => (
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
      </ScrollView>
      <CustomAlert
        visible={alertVisible}
        success={alertSuccess}
        message={alertMessage}
        primaryButtonText="Aceptar"
        onPrimaryPress={() => {
          setAlertVisible(false);
          if (alertSuccess) {
            navigation.replace("Login");
          }
        }}
      />
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    marginRight: 8,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: Math.min(SIZES.fontSizeTitle, 18),
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