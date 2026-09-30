import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { prepareAppleAccountDeletion, request } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

export default function CloseAccountScreen() {
  const { feed, signOut } = useApp();
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [socialConfirmation, setSocialConfirmation] = useState("");
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [appleLinked, setAppleLinked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  async function load() {
    setLoadError("");
    try {
      const data = await request<{ hasPassword: boolean; linkedProviders: string[] }>("?view=my");
      setHasPassword(data.hasPassword); setAppleLinked(data.linkedProviders.includes("apple"));
    } catch { setHasPassword(null); setLoadError("Could not load your account. Please try again."); }
  }
  useEffect(() => { void load(); }, []);
  const phrase = `DELETE @${feed?.user?.handle ?? ""}`;
  function close() {
    Alert.alert(
      "Permanently close account?",
      "Your profile and personal data will be removed. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Permanently close",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              if (appleLinked && !(await prepareAppleAccountDeletion())) return;
              await request("", { action: "deleteAccount", confirmation, password, socialConfirmation });
              await signOut();
              router.replace("/");
            } catch (problem) {
              Alert.alert("Account not closed", problem instanceof Error ? problem.message : "Please try again.");
            } finally { setBusy(false); }
          },
        },
      ],
    );
  }
  return (
    <Screen title="Close account" back>
      <View style={styles.warning}>
        <Text style={styles.title}>This cannot be undone</Text>
        <Text style={styles.body}>
          Your profile, posts, comments, uploaded images, sent messages, earnings
          and account settings will be deleted. Empty placeholders may remain
          where needed to preserve other members’ replies. This cannot be undone.
        </Text>
      </View>
      <View style={styles.form}>
        {loadError ? <Pressable onPress={() => void load()}><Text style={styles.body}>{loadError} Tap to retry.</Text></Pressable> : null}
        {appleLinked ? <Text style={styles.body}>Apple will ask you to confirm the connected Apple Account so we can disconnect it as part of deletion.</Text> : null}
        <Text style={styles.label}>
          Type <Text style={styles.phrase}>{phrase}</Text>
        </Text>
        <TextInput
          autoCapitalize="none"
          value={confirmation}
          onChangeText={setConfirmation}
          style={styles.input}
        />
        {hasPassword === false ? <>
          <Text style={styles.label}>Then type CLOSE MY ACCOUNT</Text>
          <TextInput autoCapitalize="characters" value={socialConfirmation} onChangeText={setSocialConfirmation} style={styles.input} />
        </> : <>
          <Text style={styles.label}>Current password</Text>
          <TextInput secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
        </>}
        <Pressable
          disabled={busy || confirmation !== phrase || hasPassword === null || (hasPassword ? !password : socialConfirmation !== "CLOSE MY ACCOUNT")}
          onPress={close}
          style={[
            styles.danger,
            (busy || confirmation !== phrase || hasPassword === null || (hasPassword ? !password : socialConfirmation !== "CLOSE MY ACCOUNT")) && styles.disabled,
          ]}
        >
          <Text style={styles.dangerText}>{busy ? "Closing account…" : "Permanently close account"}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  warning: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: "#FFF0EE",
    borderWidth: 1,
    borderColor: "#E8B9B2",
    gap: spacing.sm,
  },
  title: { color: "#8E352C", fontSize: 20, fontWeight: "900" },
  body: { color: "#6D4B48", lineHeight: 21 },
  form: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  label: { color: colours.ink, fontSize: 13, fontWeight: "700" },
  phrase: { fontWeight: "900" },
  input: {
    height: 48,
    paddingHorizontal: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#C4D0D7",
    color: colours.ink,
    fontSize: 16,
  },
  danger: {
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "#A63E34",
  },
  dangerText: { color: "white", fontWeight: "800" },
  disabled: { opacity: 0.4 },
});
