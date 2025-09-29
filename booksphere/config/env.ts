export const config = {
  MONGODB_URI: process.env.MONGODB_URI || "",
  MONGODB_DB: process.env.MONGODB_DB || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || "",
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || "",
  },
};