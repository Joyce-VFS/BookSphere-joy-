// app/(auth)/resetPassword.tsx
import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Text, Alert, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ResetPassword() {
  const router = useRouter();
  const { token, id } = useLocalSearchParams() as { token?: string; id?: string };
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no token/id in URL, tell user
    if (!token || !id) {
      Alert.alert("Invalid reset link", "Missing token or id in URL.");
    }
  }, []);

  const submit = async () => {
    if (!password || password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters.");
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      Alert.alert("Success", data.message || "Password reset successful");
      router.replace("/(auth)/signIn");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset password</Text>
      <Text>Password for user id: {id}</Text>
      <TextInput
        placeholder="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button title={loading ? "Resetting..." : "Reset Password"} onPress={submit} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 18, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 12 },
});
