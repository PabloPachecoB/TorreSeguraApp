// screens/SignUpScreen.js
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import CustomButton from '../components/CustomButton';

export default function SignUpScreen({ navigation }) {
  const handleSignUp = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Sign Up Screen</Text>
      <CustomButton
        onPress={handleSignUp}
        text="SIGN UP"
        defaultColor="#FF0000" // Color por defecto rojo
        activeColor="#00FF00" // Color activo verde chillón
        textColor="#FFF" // Texto blanco
        width={200} // Ancho personalizado
        height={40} // Alto personalizado
        borderRadius={10} // Border radius personalizado
        fontSize={16} // Tamaño de fuente personalizado
      />
    </View>
  );
}