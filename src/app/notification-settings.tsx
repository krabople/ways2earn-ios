import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

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

const alertTypes = ["All", "Earn", "Freebie", "Deal"] as const;
type AlertType = (typeof alertTypes)[number];
const alertCategories: Record<Exclude<AlertType, "All">, readonly string[]> = {
  Earn: [
    "Banking rewards",
    "Survey panels",
    "Cashback",
    "Mystery shopping",
    "User testing",
    "Miscellaneous",
  ],
  Freebie: [
    "Food & drink",
    "Samples",
    "Days out",
    "Digital freebies",
    "Home & garden",
    "Miscellaneous",
  ],
  Deal: [
    "Shopping",
    "Vouchers",
    "Tech & gaming",
    "Home & garden",
    "Food & drink",
    "Travel",
    "Subscriptions",
    "Miscellaneous",
  ],
};

export default function NotificationSettingsScreen() {
  const { action } = useApp();
  const [items, setItems] = useState<SavedAlert[]>([]);
  const [creating, setCreating] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<AlertType>("All");
  const [category, setCategory] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
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

  async function createAlert() {
    setSaving(true);
    try {
      await action({
        action: "alert",
        keyword: keyword.trim(),
        category,
        type,
        enabled: true,
        emailEnabled,
      });
      setKeyword("");
      setType("All");
      setCategory("");
      setEmailEnabled(false);
      setCreating(false);
      await load();
      Alert.alert("Alert created", "We’ll let you know when a post matches.");
    } catch (problem) {
      Alert.alert(
        "Could not create alert",
        problem instanceof Error ? problem.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function chooseType(next: AlertType) {
    setType(next);
    setCategory("");
  }

  return (
    <Screen title="Notification preferences" back>
      <Text style={styles.intro}>
        Choose which saved alerts remain active and whether matching
        opportunities should also arrive by email. Push notifications are
        controlled from Account.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: creating }}
        onPress={() => setCreating((current) => !current)}
        style={styles.createButton}
      >
        <Text style={styles.createButtonText}>
          {creating ? "Cancel" : "+ Create an alert"}
        </Text>
      </Pressable>
      {creating ? (
        <View style={styles.editor}>
          <View style={styles.field}>
            <Text style={styles.label}>Keyword (optional)</Text>
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              maxLength={100}
              placeholder="e.g. bank switch or coffee"
              placeholderTextColor={colours.slate}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Post type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {alertTypes.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => chooseType(item)}
                  style={[styles.chip, item === type && styles.chipActive]}
                >
                  <Text
                    style={
                      item === type ? styles.chipActiveText : styles.chipText
                    }
                  >
                    {item === "All" ? "Any type" : item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          {type !== "All" ? (
            <View style={styles.field}>
              <Text style={styles.label}>Category (optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {["", ...alertCategories[type]].map((item) => (
                  <Pressable
                    key={item || "any"}
                    onPress={() => setCategory(item)}
                    style={[
                      styles.chip,
                      item === category && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={
                        item === category
                          ? styles.chipActiveText
                          : styles.chipText
                      }
                    >
                      {item || "Any category"}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
          <View style={styles.emailChoice}>
            <View style={styles.emailCopy}>
              <Text style={styles.label}>Email me too</Text>
              <Text style={styles.meta}>
                Also send matching posts to your verified email address.
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ true: colours.mint }}
            />
          </View>
          <Text style={styles.scopeHelp}>
            Leave the keyword and category blank to be notified about every new
            post of the selected type.
          </Text>
          <Pressable
            disabled={saving}
            onPress={() => void createAlert()}
            style={[styles.saveButton, saving && styles.disabled]}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving…" : "Save alert"}
            </Text>
          </Pressable>
        </View>
      ) : null}
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
          body="Create an alert above and we’ll let you know when a matching opportunity is posted."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: colours.slate, fontSize: 13, lineHeight: 20 },
  createButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colours.green,
  },
  createButtonText: { color: "white", fontSize: 14, fontWeight: "800" },
  editor: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
    gap: spacing.lg,
  },
  field: { gap: 7 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#C8D4DA",
    backgroundColor: colours.surface,
    color: colours.ink,
    fontSize: 16,
  },
  chips: { gap: 8 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  chipActive: { borderColor: colours.green, backgroundColor: colours.mintPale },
  chipText: { color: colours.slate, fontSize: 12, fontWeight: "700" },
  chipActiveText: { color: colours.green, fontSize: 12, fontWeight: "800" },
  emailChoice: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  emailCopy: { flex: 1, gap: 3 },
  scopeHelp: { color: colours.slate, fontSize: 12, lineHeight: 18 },
  saveButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colours.green,
  },
  saveButtonText: { color: "white", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.5 },
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
