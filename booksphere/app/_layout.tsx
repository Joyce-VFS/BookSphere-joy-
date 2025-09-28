// Author: Joyce V. F. Santos
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token"); // token saved after login/signup
        setIsLoggedIn(!!token);
      } catch (err) {
        console.error("Error reading token:", err);
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        // Main app: show Tabs
        <>
          <Stack.Screen name="(tabs)/index" />
          <Stack.Screen name="(tabs)/explore" />
        </>
      ) : (
        // Auth flow: first screen is signIn
        <>
          <Stack.Screen name="(auth)/signIn" options={{ title: "Sign In" }} />
          <Stack.Screen name="(auth)/signUp" options={{ title: "Sign Up" }} />
        </>
      )}
    </Stack>
  );
}
