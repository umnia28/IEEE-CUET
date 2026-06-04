import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../services/api";

export default function AuthLoadingScreen({ navigation }) {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        navigation.replace("Splash");
        return;
      }

      const response = await fetch(`${API_URL}/auth/protect/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("user");

        navigation.replace("Login");
        return;
      }

      await SecureStore.setItemAsync("user", JSON.stringify(data.user));

      navigation.replace("Home");
    } catch (error) {
      console.log("Auth check error:", error);

      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("user");

      navigation.replace("Login");
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ED234F" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7F8",
  },
});