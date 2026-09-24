import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Brand } from "@/components/screen";
import { registerAccount } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";

export default function RegisterScreen() {
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!/^[a-z][a-z0-9_-]{2,24}$/i.test(handle.trim())) {
      setError("Choose a username of 3–25 letters, numbers, underscores or hyphens, starting with a letter.");
      return;
    }
    if (password.length < 12 || password.length > 72) {
      setError("Choose a password between 12 and 72 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await registerAccount(handle.trim(), email.trim(), password);
      setPassword("");
      setConfirm("");
      setComplete(true);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "We could not create your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Brand />
            <Pressable accessibilityLabel="Close registration" onPress={() => router.back()}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <View style={styles.card}>
            {complete ? (
              <>
                <Text style={styles.kicker}>ONE MORE STEP</Text>
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.help}>We sent a confirmation link to {email.trim()}. Open it to activate your account, then come back to the app and sign in. Check your spam folder if it does not arrive.</Text>
                <Pressable style={styles.primary} onPress={() => router.replace("/login")}>
                  <Text style={styles.primaryText}>Go to sign in</Text>
                </Pressable>
                <Pressable onPress={() => router.push({ pathname: "/resend-confirmation", params: { email: email.trim() } })}>
                  <Text style={styles.link}>Need a new confirmation link?</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.kicker}>JOIN THE COMMUNITY</Text>
                <Text style={styles.title}>Create your account</Text>
                <Text style={styles.help}>Browse freely. Create an account to post, comment, vote and save opportunities. You will need to confirm your email address before signing in.</Text>
                <View style={styles.field}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput autoCapitalize="none" autoCorrect={false} autoComplete="username-new" maxLength={25} value={handle} onChangeText={setHandle} style={styles.input} />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Email address</Text>
                  <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" value={email} onChangeText={setEmail} style={styles.input} />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput secureTextEntry textContentType="newPassword" value={password} onChangeText={setPassword} style={styles.input} />
                  <Text style={styles.help}>At least 12 characters.</Text>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Confirm password</Text>
                  <TextInput secureTextEntry textContentType="newPassword" value={confirm} onChangeText={setConfirm} style={styles.input} />
                </View>
                {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
                <Pressable disabled={busy || !handle.trim() || !email.trim() || !password || !confirm} style={[styles.primary, (busy || !handle.trim() || !email.trim() || !password || !confirm) && styles.disabled]} onPress={() => void submit()}>
                  <Text style={styles.primaryText}>{busy ? "Creating account…" : "Create account"}</Text>
                </Pressable>
                <Text style={styles.help}>By joining, you can read our privacy information and community rules in the Account tab.</Text>
                <Pressable onPress={() => router.replace("/login")}><Text style={styles.link}>Already a member? Sign in</Text></Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.canvas },
  page: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  close: { color: colours.slate, fontSize: 34, fontWeight: "300" },
  card: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface, gap: spacing.lg },
  kicker: { color: colours.green, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  title: { color: colours.ink, fontSize: 26, fontWeight: "900" },
  help: { color: colours.slate, fontSize: 13, lineHeight: 20 },
  field: { gap: 6 },
  label: { color: colours.ink, fontSize: 13, fontWeight: "800" },
  input: { minHeight: 50, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: "#C4D0D7", color: colours.ink, fontSize: 16 },
  error: { color: "#A63E34", lineHeight: 20 },
  primary: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colours.green },
  primaryText: { color: "white", fontWeight: "800" },
  disabled: { opacity: 0.45 },
  link: { color: colours.green, fontSize: 14, fontWeight: "800", textAlign: "center" },
});
