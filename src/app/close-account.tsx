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
import { request } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

export default function CloseAccountScreen() {
  const { feed, action, signOut } = useApp();
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [socialConfirmation, setSocialConfirmation] = useState("");
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  useEffect(() => { void request<{ hasPassword: boolean }>("?view=my").then(data => setHasPassword(data.hasPassword)).catch(() => setHasPassword(null)); }, []);
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
            await action({ action: "deleteAccount", confirmation, password, socialConfirmation });
            await signOut();
            router.replace("/");
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
          Your account and associated personal data will be deleted.
          Contributions that must remain to preserve conversations will be
          anonymised as described in the privacy policy.
        </Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>
          Type <Text style={styles.phrase}>{phrase}</Text>
        </Text>
        <TextInput
          autoCapitalize="characters"
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
          disabled={confirmation !== phrase || hasPassword === null || (hasPassword ? !password : socialConfirmation !== "CLOSE MY ACCOUNT")}
          onPress={close}
          style={[
            styles.danger,
            (confirmation !== phrase || hasPassword === null || (hasPassword ? !password : socialConfirmation !== "CLOSE MY ACCOUNT")) && styles.disabled,
          ]}
        >
          <Text style={styles.dangerText}>Permanently close account</Text>
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
