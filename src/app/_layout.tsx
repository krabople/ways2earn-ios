import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colours } from "@/lib/theme";
import { AppProvider } from "@/providers/app-provider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}><AppProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colours.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="opportunity/[slug]" />
        <Stack.Screen name="member/[handle]" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="login" options={{ presentation: "formSheet" }} />
        <Stack.Screen name="register" options={{ presentation: "formSheet" }} />
        <Stack.Screen name="resend-confirmation" options={{ presentation: "formSheet" }} />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="trust" />
        <Stack.Screen name="support" />
      </Stack>
    </AppProvider></GestureHandlerRootView>
  );
}
