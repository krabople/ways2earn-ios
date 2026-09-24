import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Brand } from "@/components/screen";
import { resendConfirmation } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";

export default function ResendConfirmationScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await resendConfirmation(email.trim());
      setMessage(response.message);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "We could not resend the link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
        <View style={styles.header}>
          <Brand />
          <Pressable accessibilityLabel="Close resend confirmation" onPress={() => router.back()}><Text style={styles.close}>×</Text></Pressable>
        </View>
        <View style={styles.card}>
          <Text style={styles.kicker}>EMAIL CONFIRMATION</Text>
          <Text style={styles.title}>Need a new link?</Text>
          <Text style={styles.help}>Enter the email address you registered with. If the account is still pending, we will send another confirmation link.</Text>
          <Text style={styles.label}>Email address</Text>
          <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" value={email} onChangeText={setEmail} style={styles.input} />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.help}>{message}</Text> : null}
          <Pressable disabled={busy || !email.trim()} onPress={() => void submit()} style={[styles.primary, (busy || !email.trim()) && styles.disabled]}>
            <Text style={styles.primaryText}>{busy ? "Sending…" : "Resend confirmation email"}</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/login")}><Text style={styles.link}>Back to sign in</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.canvas },
  page: { flex: 1, padding: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  close: { color: colours.slate, fontSize: 34, fontWeight: "300" },
  card: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface, gap: spacing.lg },
  kicker: { color: colours.green, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  title: { color: colours.ink, fontSize: 26, fontWeight: "900" },
  help: { color: colours.slate, fontSize: 13, lineHeight: 20 },
  label: { color: colours.ink, fontSize: 13, fontWeight: "800" },
  input: { minHeight: 50, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: "#C4D0D7", color: colours.ink, fontSize: 16 },
  error: { color: "#A63E34", lineHeight: 20 },
  primary: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colours.green },
  primaryText: { color: "white", fontWeight: "800" },
  disabled: { opacity: 0.45 },
  link: { color: colours.green, fontSize: 14, fontWeight: "800", textAlign: "center" },
});
