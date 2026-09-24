import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { MessageState } from "@/components/states";
import { request } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

type SavedAlert = {
  id: string;
  keyword: string | null;
  category: string | null;
  opportunity_type: "Earn" | "Freebie" | "Deal" | null;
  is_active: number;
  email_enabled: number;
};

export default function NotificationSettingsScreen() {
  const { action } = useApp();
  const [items, setItems] = useState<SavedAlert[]>([]);
  const load = useCallback(async () => {
    const result = await request<{ alerts: SavedAlert[] }>("?view=my");
    setItems(result.alerts);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function change(
    item: SavedAlert,
    values: Partial<{ enabled: boolean; emailEnabled: boolean }>,
  ) {
    try {
      await action({
        action: "alert",
        id: item.id,
        keyword: item.keyword ?? "",
        category: item.category ?? "",
        type: item.opportunity_type ?? "All",
        enabled: values.enabled ?? Boolean(item.is_active),
        emailEnabled: values.emailEnabled ?? Boolean(item.email_enabled),
      });
      await load();
    } catch (problem) {
      Alert.alert(
        "Could not update alert",
        problem instanceof Error ? problem.message : "Please try again.",
      );
    }
  }

  return (
    <Screen title="Notification preferences" back>
      <Text style={styles.intro}>
        Choose which saved alerts remain active and whether matching
        opportunities should also arrive by email. Push notifications are
        controlled from Account.
      </Text>
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.copy}>
            <Text style={styles.title}>
              {item.keyword ||
                item.category ||
                item.opportunity_type ||
                "All opportunities"}
            </Text>
            <Text style={styles.meta}>
              {[item.opportunity_type, item.category]
                .filter(Boolean)
                .join(" · ") || "Any post type"}
            </Text>
          </View>
          <View style={styles.setting}>
            <Text style={styles.label}>In-app alert</Text>
            <Switch
              value={Boolean(item.is_active)}
              onValueChange={(enabled) => void change(item, { enabled })}
              trackColor={{ true: colours.mint }}
            />
          </View>
          <View style={styles.setting}>
            <Text style={styles.label}>Email too</Text>
            <Switch
              value={Boolean(item.email_enabled)}
              onValueChange={(emailEnabled) =>
                void change(item, { emailEnabled })
              }
              trackColor={{ true: colours.mint }}
            />
          </View>
        </View>
      ))}
      {!items.length ? (
        <MessageState
          title="No saved alerts"
          body="Create an alert on the website for now; it will appear here and can be managed from the app."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: colours.slate, fontSize: 13, lineHeight: 20 },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
    gap: spacing.md,
  },
  copy: { gap: 3 },
  title: { color: colours.ink, fontSize: 16, fontWeight: "800" },
  meta: { color: colours.slate, fontSize: 11 },
  setting: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colours.line,
    paddingTop: spacing.sm,
  },
  label: { color: colours.ink, fontSize: 13, fontWeight: "700" },
});
