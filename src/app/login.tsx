import { router } from "expo-router";
import { useEffect, useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Brand } from "@/components/screen";
import { ApiError, socialProviders, type SocialProvider } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

export default function LoginScreen() {
  const { signIn, signInWithProvider } = useApp();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [providers, setProviders] = useState<SocialProvider[]>([]);

  useEffect(() => { void socialProviders().then(setProviders).catch(() => setProviders([])); }, []);

  async function social(provider: SocialProvider) {
    setBusy(true); setError("");
    try { if (await signInWithProvider(provider)) router.back(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Sign-in failed."); }
    finally { setBusy(false); }
  }

  async function submit() {
    setBusy(true);
    setError("");
    setPendingEmail("");
    try {
      await signIn(login.trim(), password);
      router.back();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Sign-in failed.");
      if (problem instanceof ApiError && problem.code === "email_pending")
        setPendingEmail(problem.email || (login.includes("@") ? login.trim() : ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.page}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Brand />
            <Pressable
              accessibilityLabel="Close sign in"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <View style={styles.card}>
          <Text style={styles.kicker}>WELCOME BACK</Text>
          <Text style={styles.title}>Sign in to Ways2Earn</Text>
          <Text style={styles.help}>
            Use the same username, email and password as the website.
          </Text>
          <View style={styles.field}>
            <Text style={styles.label}>Username or email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              value={login}
              onChangeText={setLogin}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              secureTextEntry
              textContentType="password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
          </View>
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          {pendingEmail ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: "/resend-confirmation", params: { email: pendingEmail } })
              }
            >
              <Text style={styles.link}>Resend confirmation email</Text>
            </Pressable>
          ) : null}
          <Pressable
            disabled={busy || !login || !password}
            onPress={() => void submit()}
            style={[
              styles.primary,
              (busy || !login || !password) && styles.disabled,
            ]}
          >
            <Text style={styles.primaryText}>
              {busy ? "Signing in…" : "Sign in securely"}
            </Text>
          </Pressable>
          {providers.length ? (
            <View style={styles.socialChoices}>
              <Text style={styles.help}>Or sign in with an account you already have</Text>
              {providers.map((provider) =>
                provider === "apple" ? (
                  <AppleAuthentication.AppleAuthenticationButton
                    key="apple"
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={8}
                    style={styles.appleButton}
                    onPress={() => { if (!busy) void social("apple"); }}
                  />
                ) : (
                  <Pressable
                    key={provider}
                    accessibilityRole="button"
                    disabled={busy}
                    style={[styles.socialButton, busy && styles.disabled]}
                    onPress={() => void social(provider)}
                  >
                    <Text style={styles.socialText}>Continue with Facebook</Text>
                  </Pressable>
                ),
              )}
            </View>
          ) : null}
          <Text style={styles.security}>
            Your password is sent only to Ways2Earn over HTTPS and is never
            stored on this device.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/register")}>
            <Text style={styles.link}>New here? Create an account</Text>
          </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.canvas },
  page: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  close: { color: colours.slate, fontSize: 34, fontWeight: "300" },
  card: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
    gap: spacing.lg,
  },
  kicker: {
    color: colours.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: colours.ink,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  help: { color: colours.slate, fontSize: 13, lineHeight: 19 },
  field: { gap: 6 },
  label: { color: colours.ink, fontSize: 13, fontWeight: "800" },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#C4D0D7",
    color: colours.ink,
    fontSize: 16,
  },
  error: { color: "#A63E34", lineHeight: 19 },
  primary: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colours.green,
  },
  primaryText: { color: "white", fontWeight: "800" },
  disabled: { opacity: 0.45 },
  security: {
    color: colours.slate,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  link: { color: colours.green, fontSize: 14, fontWeight: "800", textAlign: "center" },
  socialChoices: { gap: 9, alignItems: "stretch" },
  socialButton: { minHeight: 48, borderWidth: 1, borderColor: colours.line, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  appleButton: { width: "100%", height: 48 },
  socialText: { color: colours.ink, fontWeight: "800" },
});
