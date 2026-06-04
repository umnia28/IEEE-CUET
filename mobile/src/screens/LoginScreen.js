import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../services/api";

const PRIMARY = "#c6586f";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      Alert.alert("Missing Information", "Please enter phone number and password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", data.message || "Invalid phone or password");
        return;
      }

      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));

      Alert.alert("Success", "Logged in successfully");

      // Later change this to your home/dashboard screen.
      navigation.replace("Home");
    } catch (error) {
      console.log("Login error:", error);
      Alert.alert("Network Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Nirvaya</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your safety network
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>PHONE NUMBER</Text>
          <TextInput
            style={styles.input}
            placeholder="017XXXXXXXX"
            placeholderTextColor="#9B7A83"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#9B7A83"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

         
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>
              Don&apos;t have an account? Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F8",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFF7F8",
  },

  header: {
    backgroundColor: PRIMARY,
    paddingTop: 70,
    paddingHorizontal: 24,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 28,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
  },

  subtitle: {
    color: "#FFE5EA",
    fontSize: 15,
    marginTop: 10,
    lineHeight: 22,
  },

  card: {
    marginHorizontal: 20,
    marginTop: -22,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },

  label: {
    color: "#6F4B55",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#FFF3F5",
    borderWidth: 1,
    borderColor: "#FFD1DA",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: "#222222",
    marginBottom: 16,
  },

  forgotText: {
    color: PRIMARY,
    fontWeight: "700",
    textAlign: "right",
    marginTop: -4,
    marginBottom: 24,
  },

  loginButton: {
    backgroundColor: PRIMARY,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  registerText: {
    color: PRIMARY,
    textAlign: "center",
    fontWeight: "700",
    marginTop: 24,
  },
});