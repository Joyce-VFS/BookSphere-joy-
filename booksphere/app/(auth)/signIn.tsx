// app/(auth)/signIn.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";

/*
  IMPORTANT: set BACKEND_URL to where your server is running.
  - While developing on the same machine and using Expo web, `http://localhost:5000` works.
  - If testing on a phone/emulator, replace 'localhost' with your machine LAN IP, e.g. 'http://192.168.1.10:5000'
*/
const BACKEND_URL = "http://localhost:5000";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const [loadingForgot, setLoadingForgot] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill both email and password");

    setLoadingSignIn(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      console.log("login response:", res.status, data);

      if (!res.ok) {
        return Alert.alert("Login failed", data.message || "Invalid credentials");
      }

      // Save token and user (if present)
      if (data.token) await AsyncStorage.setItem("token", data.token);
      if (data.user) await AsyncStorage.setItem("user", JSON.stringify(data.user));

      Alert.alert("Welcome", `Hi ${data.user?.firstName || data.user?.email || ""}`);
      router.replace("/(tabs)"); // go to main app
    } catch (err: any) {
      console.error("signIn error:", err);
      Alert.alert("Network error", err.message || "Something went wrong");
    } finally {
      setLoadingSignIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return Alert.alert("Error", "Please enter your email first");

    setLoadingForgot(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("forgot-password response:", res.status, data);

      if (!res.ok) {
        return Alert.alert("Error", data.message || "Failed to request password reset");
      }

      // If backend returns resetURL (dev/test), open it or show preview
      if (data.resetURL) {
        Alert.alert("Reset email sent", "A password reset link was generated. Opening it now for testing.");
        // Try opening link in browser (will fail if frontend not running, but still useful)
        try {
          await Linking.openURL(data.resetURL);
        } catch (linkErr) {
          console.warn("openURL failed", linkErr);
          // show the URL so dev can copy/paste into Postman/browser
          Alert.alert("Reset link (dev)", data.resetURL);
        }
      } else {
        // If email sent via real provider, show message
        Alert.alert("Reset email sent", data.message || "Check your email");
        if (data.previewUrl) {
          // ethereal preview
          Alert.alert("Email preview (dev)", data.previewUrl);
        }
      }
    } catch (err: any) {
      console.error("forgot-password error:", err);
      Alert.alert("Network error", err.message || "Something went wrong");
    } finally {
      setLoadingForgot(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign In</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={{ marginVertical: 8 }}>
        {loadingForgot ? (
          <ActivityIndicator />
        ) : (
          <Button title="Forgot Password?" onPress={handleForgotPassword} />
        )}
      </View>

      <View style={{ marginTop: 8 }}>
        {loadingSignIn ? (
          <ActivityIndicator />
        ) : (
          <Button title="Sign In" onPress={handleSignIn} />
        )}
      </View>

      <Text style={styles.link} onPress={() => router.push("/(auth)/signUp")}>
        Don’t have an account? Sign Up
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 26, fontWeight: "700", marginBottom: 18, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  link: { color: "blue", marginTop: 15, textAlign: "center" },
});
