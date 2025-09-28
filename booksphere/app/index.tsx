import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        router.replace("/(tabs)"); // logged in -> main app
      } else {
        router.replace("/(auth)/signIn"); // not logged in -> auth
      }
    };
    redirect();
  }, []);

  return null; // show nothing while redirecting
}
