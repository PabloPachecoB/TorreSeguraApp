import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../components/BottomNav";
import { useNavigationContext } from "../context/NavigationContext";
import { useUserContext } from "../context/UserContext";
import { COLORS, SIZES } from "../constants";

const paymentMethods = [
  { id: "1", title: "Transferencia Bancaria", icon: "business-outline", color: COLORS.primary },
  { id: "2", title: "Tarjeta de Crédito/Débito", icon: "card-outline", color: COLORS.secondary },
  { id: "3", title: "Código QR (VPay/$imple)", icon: "qr-code-outline", color: COLORS.success },
];

const mockExpenses = [
  { id: "1", description: "Cuota de mantenimiento - Abril 2025", amount: "500 BOB", dueDate: "2025-04-30" },
  { id: "2", description: "Cuota de mantenimiento - Marzo 2025", amount: "500 BOB", dueDate: "2025-03-31" },
];

export default function PaymentScreen({ navigation }) {
  const { user } = useUserContext();
  const { selectedTab } = useNavigationContext();
  const [expenses, setExpenses] = useState(mockExpenses);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState("");

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const response = await fetch("https://tu-backend/api/expenses", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar expensas");
        }

        const data = await response.json();
        setExpenses(data);
      } catch (error) {
        console.error("Error al cargar expensas:", error);
        setExpenses(mockExpenses);
      }
    };
    loadExpenses();
  }, []);

  const saveNotification = async (message) => {
    try {
      const storedNotifications = await AsyncStorage.getItem("notifications");
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      const newNotification = {
        message,
        date: new Date().toISOString(),
      };
      notifications.push(newNotification);
      await AsyncStorage.setItem("notifications", JSON.stringify(notifications));
    } catch (error) {
      console.error("Error al guardar notificación:", error);
    }
  };

  const handleExpensePress = (expense) => {
    setSelectedExpense(expense);
    setModalVisible(true);
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handlePay = async () => {
    if (!selectedMethod) {
      Alert.alert("Error", "Por favor, selecciona un método de pago.");
      return;
    }

    if (!paymentDetails.trim() && selectedMethod.id !== "3") {
      Alert.alert("Error", "Por favor, ingresa los detalles del pago.");
      return;
    }

    try {
      const response = await fetch("https://tu-backend/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          expenseId: selectedExpense.id,
          amount: selectedExpense.amount,
          method: selectedMethod.title,
          details: paymentDetails,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al procesar el pago");
      }

      saveNotification(`Pago realizado: ${selectedExpense.description} - ${selectedExpense.amount}`);
      Alert.alert("Éxito", "Pago realizado correctamente.");
      setModalVisible(false);
      setSelectedExpense(null);
      setSelectedMethod(null);
      setPaymentDetails("");
      setExpenses(expenses.filter((exp) => exp.id !== selectedExpense.id));
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      saveNotification(`Pago realizado: ${selectedExpense.description} - ${selectedExpense.amount}`);
      Alert.alert("Éxito", "Pago realizado correctamente (simulado).");
      setModalVisible(false);
      setSelectedExpense(null);
      setSelectedMethod(null);
      setPaymentDetails("");
      setExpenses(expenses.filter((exp) => exp.id !== selectedExpense.id));
    }
  };

  const renderExpense = ({ item }) => (
    <TouchableOpacity style={styles.expenseItem} onPress={() => handleExpensePress(item)}>
      <View style={styles.expenseHeader}>
        <Icon name="document-text-outline" size={24} color={COLORS.primary} />
        <Text style={styles.expenseText}>{item.description}</Text>
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDetail}>
          <Text style={styles.label}>Monto:</Text> {item.amount}
        </Text>
        <Text style={styles.expenseDetail}>
          <Text style={styles.label}>Vence:</Text> {item.dueDate}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMethod = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.methodItem,
        selectedMethod?.id === item.id && { borderColor: item.color, borderWidth: 2 },
      ]}
      onPress={() => handleMethodSelect(item)}
    >
      <View style={styles.methodHeader}>
        <Icon name={item.icon} size={24} color={item.color} />
        <Text style={styles.methodText}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={30} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagos</Text>
        <View style={{ width: 30 }} />
      </View>
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.expenseList}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay expensas pendientes.</Text>}
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedExpense(null);
          setSelectedMethod(null);
          setPaymentDetails("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Pagar {selectedExpense?.description}</Text>
            <Text style={styles.modalAmount}>Monto: {selectedExpense?.amount}</Text>
            <Text style={styles.modalSubtitle}>Selecciona un método de pago:</Text>
            <FlatList
              data={paymentMethods}
              renderItem={renderMethod}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.methodList}
            />
            {selectedMethod?.id !== "3" && (
              <TextInput
                style={styles.modalInput}
                placeholder={
                  selectedMethod?.id === "1"
                    ? "Número de transacción o referencia"
                    : "Últimos 4 dígitos de la tarjeta"
                }
                placeholderTextColor={COLORS.gray}
                value={paymentDetails}
                onChangeText={setPaymentDetails}
              />
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.payButton} onPress={handlePay}>
                <Text style={styles.payButtonText}>Pagar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedExpense(null);
                  setSelectedMethod(null);
                  setPaymentDetails("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  expenseList: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  expenseItem: {
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
    borderColor: COLORS.primary,
  },
  expenseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  expenseText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    fontWeight: "bold",
    color: COLORS.black,
    marginLeft: 10,
  },
  expenseInfo: {
    marginLeft: 34,
  },
  expenseDetail: {
    fontSize: SIZES.fontSizeSmall,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    marginBottom: 5,
  },
  label: {
    fontWeight: "bold",
    color: COLORS.black,
  },
  emptyText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    marginBottom: 10,
  },
  modalAmount: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginBottom: 15,
  },
  modalSubtitle: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Medium",
    color: COLORS.black,
    marginBottom: 10,
  },
  methodList: {
    paddingVertical: 10,
  },
  methodItem: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  methodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodText: {
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
    color: COLORS.black,
    marginLeft: 10,
  },
  modalInput: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 8,
    width: "100%",
    marginVertical: 10,
    color: COLORS.black,
    fontSize: SIZES.fontSizeBody,
    fontFamily: "Roboto-Regular",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 5,
  },
  payButtonText: {
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