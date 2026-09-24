import { StyleSheet, Text, View } from "react-native";

import { colours, radius, spacing } from "@/lib/theme";

export function MessageState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    color: colours.ink,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  body: {
    color: colours.slate,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
