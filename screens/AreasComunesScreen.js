// screens/AreasComunesScreen.js
import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { COLORS, SIZES } from "../constants";

const initialAreas = [
  {
    id: "1",
    name: "Parrillero Monte Negro",
    image: require("../assets/imgParrillero.png"),
  },
  {
    id: "2",
    name: "Sala de Reuniones Muguel",
    image: require("../assets/imgSaladerunion.png"),
  },
  {
    id: "3",
    name: "Parque Nidito Feliz",
    image: require("../assets/imgParque.png"),
  },
];

export default function AreasComunesScreen({ navigation, route }) {
  const role = route.params?.role || "propietario";
  const { selectedTab } = useNavigationContext();

  const renderArea = ({ item }) => (
    <View style={styles.areaItem}>
      <View style={styles.areaInfo}>
        <Text style={styles.areaName}>{item.name}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("AreaDetails", { area: item })}
          >
            <Text style={styles.buttonText}>Ver Más</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("ReserveArea", { area: item })}
          >
            <Text style={styles.buttonText}>Reservar</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Image source={item.image} style={styles.areaImage} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={SIZES.iconSize} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Áreas Comunes</Text>
        <View style={{ width: 30 }} />
      </View>
      <FlatList
        data={initialAreas}
        renderItem={renderArea}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <BottomNav selectedTab={selectedTab} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.fontSizeTitle, // Tamaño para títulos
    fontFamily: "Roboto-Bold", // Título principal
    fontWeight: "bold",
    color: COLORS.black,
  },
  list: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  areaItem: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: "center",
  },
  areaInfo: {
    flex: 1,
    marginRight: 10,
  },
  areaName: {
    fontSize: SIZES.fontSizeSubtitle, // Tamaño para subtítulos
    fontFamily: "Roboto-Medium", // Subtítulo
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody, // Tamaño para texto normal
    fontFamily: "Roboto-Regular", // Texto normal
    fontWeight: "bold",
  },
  areaImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});