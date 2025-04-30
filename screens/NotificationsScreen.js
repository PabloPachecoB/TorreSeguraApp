import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from "react-native-image-picker";

const initialNotifications = [
  {
    id: "1",
    message: "Área reservada: Parrillero Monte Negro el 2025-05-01 de 14:00 a 16:00",
    date: "2025-04-30T10:00:00.000Z",
    type: "message",
    author: "Sistema",
    isAnonymous: false,
    photo: null,
  },
  {
    id: "2",
    message: "Visitante Luis Rodríguez ha salido.",
    date: "2025-04-30T09:15:00.000Z",
    type: "message",
    author: "Sistema",
    isAnonymous: false,
    photo: null,
  },
];

export default function NotificationsScreen({ navigation }) {
  const { selectedTab } = useNavigationContext();
  const { user } = useUserContext();
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [votingOptions, setVotingOptions] = useState(["Sí", "No", "Abstenerse"]);
  const [votes, setVotes] = useState({});

  // Verificar si el usuario está autenticado
  useEffect(() => {
    if (!user || !user.username || !user.role) {
      navigation.replace("Login");
    }
  }, [user, navigation]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const storedNotifications = await AsyncStorage.getItem("notifications");
        const parsedNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
        setNotifications(parsedNotifications.length > 0 ? parsedNotifications : initialNotifications);
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
        setNotifications(initialNotifications);
      }
    };
    loadNotifications();
  }, []);

  const saveNotification = async (newNotification) => {
    try {
      const updatedNotifications = [...notifications, newNotification];
      await AsyncStorage.setItem("notifications", JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Error al guardar notificación:", error);
    }
  };

  const handleAddNotification = () => {
    if (!message.trim()) {
      Alert.alert("Error", "Por favor, escribe un mensaje.");
      return;
    }

    const newNotification = {
      id: (notifications.length + 1).toString(),
      message,
      date: new Date().toISOString(),
      type: isVoting ? "voting" : "message",
      author: isAnonymous ? "Anónimo" : user?.username || "Usuario",
      isAnonymous,
      photo: photo ? photo.uri : null,
      votingOptions: isVoting ? votingOptions : null,
      votes: isVoting ? votingOptions.reduce((acc, option) => ({ ...acc, [option]: 0 }), {}) : null,
    };

    saveNotification(newNotification);
    setModalVisible(false);
    setMessage("");
    setIsAnonymous(false);
    setPhoto(null);
    setIsVoting(false);
  };

  const handleVote = (notificationId, option) => {
    if (user?.role !== "propietario") {
      Alert.alert("Error", "Solo los residentes pueden votar.");
      return;
    }

    const updatedNotifications = notifications.map((notification) => {
      if (notification.id === notificationId && notification.type === "voting") {
        return {
          ...notification,
          votes: {
            ...notification.votes,
            [option]: (notification.votes[option] || 0) + 1,
          },
        };
      }
      return notification;
    });

    setNotifications(updatedNotifications);
    AsyncStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  const handleSelectPhoto = () => {
    launchImageLibrary({ mediaType: "photo", quality: 1 }, (response) => {
      if (response.didCancel) {
        console.log("Selección de foto cancelada");
      } else if (response.errorCode) {
        console.error("Error al seleccionar foto:", response.errorMessage);
        Alert.alert("Error", "No se pudo seleccionar la foto.");
      } else if (response.assets && response.assets.length > 0) {
        setPhoto(response.assets[0]);
      }
    });
  };

  const renderNotification = ({ item }) => (
    <View style={[styles.notificationItem, { borderColor: item.type === "voting" ? COLORS.secondary : COLORS.primary }]}>
      <View style={styles.notificationHeader}>
        <Icon
          name={item.type === "voting" ? "checkbox-outline" : "notifications-outline"}
          size={24}
          color={item.type === "voting" ? COLORS.secondary : COLORS.primary}
        />
        <Text style={styles.notificationText}>{item.message}</Text>
      </View>
      <View style={styles.notificationInfo}>
        <Text style={styles.notificationDetail}>
          <Text style={styles.label}>Autor:</Text> {item.author}
        </Text>
        <Text style={styles.notificationDetail}>
          <Text style={styles.label}>Fecha:</Text> {new Date(item.date).toLocaleString()}
        </Text>
        {item.photo && (
          <Image source={{ uri: item.photo }} style={styles.notificationImage} />
        )}
        {item.type === "voting" && (
          <View style={styles.votingContainer}>
            <Text style={styles.votingTitle}>Opciones de votación:</Text>
            <View style={styles.votingOptions}>
              {item.votingOptions.map((option) => (
                <View key={option} style={styles.votingOption}>
                  <TouchableOpacity
                    style={styles.voteButton}
                    onPress={() => handleVote(item.id, option)}
                  >
                    <Text style={styles.voteButtonText}>{option}</Text>
                  </TouchableOpacity>
                  <Text style={styles.voteCount}>{item.votes[option] || 0} votos</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  // Si el usuario no está autenticado, no renderizamos nada (la redirección se maneja en useEffect)
  if (!user || !user.username || !user.role) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 30 }} />
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={30} color={COLORS.white} />
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setMessage("");
          setIsAnonymous(false);
          setPhoto(null);
          setIsVoting(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Nueva Notificación</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Escribe tu mensaje..."
                placeholderTextColor={COLORS.gray}
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handleSelectPhoto}
              >
                <Text style={styles.photoButtonText}>
                  {photo ? "Foto seleccionada" : "Seleccionar foto"}
                </Text>
              </TouchableOpacity>
              {photo && (
                <Image source={{ uri: photo.uri }} style={styles.previewImage} />
              )}
              <View style={styles.anonymousContainer}>
                <Text style={styles.anonymousLabel}>Publicar como anónimo:</Text>
                <TouchableOpacity
                  style={[styles.anonymousToggle, isAnonymous && styles.anonymousToggleActive]}
                  onPress={() => setIsAnonymous(!isAnonymous)}
                >
                  <Text style={styles.anonymousToggleText}>{isAnonymous ? "Sí" : "No"}</Text>
                </TouchableOpacity>
              </View>
              {user?.role === "propietario" && (
                <View style={styles.anonymousContainer}>
                  <Text style={styles.anonymousLabel}>Crear votación:</Text>
                  <TouchableOpacity
                    style={[styles.anonymousToggle, isVoting && styles.anonymousToggleActive]}
                    onPress={() => setIsVoting(!isVoting)}
                  >
                    <Text style={styles.anonymousToggleText}>{isVoting ? "Sí" : "No"}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddNotification}>
                  <Text style={styles.addButtonText}>Añadir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    setMessage("");
                    setIsAnonymous(false);
                    setPhoto(null);
                    setIsVoting(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    fontSize: SIZES.fontSizeTitle,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    color: COLORS.black,
  },
  list: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  notificationItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 4,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  notificationText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginLeft: 10,
  },
  notificationInfo: {
    marginLeft: 34,
  },
  notificationDetail: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginBottom: 5,
  },
  label: {
    fontWeight: "bold",
    color: COLORS.black,
  },
  notificationImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  votingContainer: {
    marginTop: 10,
  },
  votingTitle: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Medium",
    color: COLORS.black,
    marginBottom: 5,
  },
  votingOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  votingOption: {
    alignItems: "center",
  },
  voteButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  voteButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    fontWeight: "bold",
  },
  voteCount: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    width: "90%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: SIZES.fontSizeSubtitle,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 15,
  },
  modalInput: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 8,
    width: "100%",
    height: 100,
    marginBottom: 20,
    color: COLORS.black,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    textAlignVertical: "top",
  },
  photoButton: {
    backgroundColor: COLORS.gray,
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: "center",
  },
  photoButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    fontWeight: "bold",
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 20,
  },
  anonymousContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  anonymousLabel: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
  },
  anonymousToggle: {
    backgroundColor: COLORS.gray,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  anonymousToggleActive: {
    backgroundColor: COLORS.primary,
  },
  anonymousToggleText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    fontWeight: "bold",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 5,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginLeft: 5,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
  },
});