// screens/WelcomeScreen.js
import React from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../constants/colors";
import { SIZES } from "../constants/sizes";
import MyButton from "../components/MyButton";

export default function WelcomeScreen({ navigation }) {
    return (
        <ImageBackground
            source={require("../assets/Fondo_Log.jpg")}
            style={styles.background}
            resizeMode="cover"
        >
            <StatusBar style="light" />
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Bienvenido a Torre Segura</Text>
                    <Text style={styles.subtitle}>
                        El lugar de confianza para tu edificio y tu familia.
                    </Text>
                    <MyButton
                        text="Comenzar"
                        onPress={() => navigation.replace("Login")}
                        variant="default"
                    />

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
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: SIZES.padding,
    },
    container: {
        alignItems: "center",
        padding: SIZES.padding,
        backgroundColor: "rgba(255,255,255,0.85)",
        borderRadius: SIZES.borderRadius * 2,
    },
    title: {
        fontSize: SIZES.fontSizeTitle + 4,
        color: COLORS.primary,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: SIZES.margin / 2,
        fontFamily: "Roboto-Bold",
    },
    subtitle: {
        fontSize: SIZES.fontSizeSubtitle,
        color: COLORS.gray,
        textAlign: "center",
        marginBottom: SIZES.margin,
        fontFamily: "Roboto-Regular",
    },
});
