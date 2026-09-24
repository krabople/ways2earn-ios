import { useCallback, useEffect, useMemo, useState } from "react";
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

type Earning = {
  id: string;
  title: string;
  amount_minor: number;
  earned_on: string;
  notes: string;
};
type Range = "30d" | "90d" | "year" | "all";
const ranges: [Range, string][] = [
  ["30d", "30 days"],
  ["90d", "90 days"],
  ["year", "This year"],
  ["all", "All time"],
];
const money = (minor: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    minor / 100,
  );

export default function EarningsScreen() {
  const { action } = useApp();
  const [items, setItems] = useState<Earning[]>([]);
  const [range, setRange] = useState<Range>("90d");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [openedAt] = useState(() => Date.now());
  const load = useCallback(async () => {
    const result = await request<{ earnings: Earning[] }>("?view=my");
    setItems(result.earnings);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (range === "all") return true;
        const when = new Date(`${item.earned_on}T12:00:00`).getTime();
        const now = new Date(openedAt);
        if (range === "year")
          return new Date(when).getFullYear() === now.getFullYear();
        return when >= openedAt - (range === "30d" ? 30 : 90) * 86400000;
      }),
    [items, openedAt, range],
  );
  const total = useMemo(
    () => filtered.reduce((sum, item) => sum + Number(item.amount_minor), 0),
    [filtered],
  );
  const months = useMemo(() => {
    const result: { label: string; amount: number }[] = [];
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - offset);
      const key = date.toISOString().slice(0, 7);
      result.push({
        label: date.toLocaleDateString("en-GB", { month: "short" }),
        amount: items
          .filter((item) => item.earned_on.startsWith(key))
          .reduce((sum, item) => sum + Number(item.amount_minor), 0),
      });
    }
    return result;
  }, [items]);
  const maximum = Math.max(1, ...months.map((month) => month.amount));
  async function add() {
    const amountMinor = Math.round(Number(amount) * 100);
    if (!title.trim() || !Number.isFinite(amountMinor) || amountMinor <= 0)
      return;
    try {
      await action({ action: "earning", title, amountMinor, date, notes: "" });
      setTitle("");
      setAmount("");
      await load();
    } catch (problem) {
      Alert.alert(
        "Could not add earning",
        problem instanceof Error ? problem.message : "Please try again.",
      );
    }
  }
  function remove(item: Earning) {
    Alert.alert(
      "Delete this record?",
      `${item.title} · ${money(item.amount_minor)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            void action({ action: "deleteEarning", id: item.id }).then(load),
        },
      ],
    );
  }

  return (
    <Screen title="Earnings tracker" back>
      <View style={styles.filters}>
        {ranges.map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setRange(key)}
            style={[styles.filter, range === key && styles.filterActive]}
          >
            <Text
              style={[
                styles.filterText,
                range === key && styles.filterTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.total}>
        <Text style={styles.totalLabel}>TOTAL FOR THIS VIEW</Text>
        <Text style={styles.totalValue}>{money(total)}</Text>
        <View style={styles.stats}>
          <View>
            <Text style={styles.statValue}>{filtered.length}</Text>
            <Text style={styles.statLabel}>payments</Text>
          </View>
          <View>
            <Text style={styles.statValue}>
              {filtered.length
                ? money(Math.round(total / filtered.length))
                : "£0.00"}
            </Text>
            <Text style={styles.statLabel}>average</Text>
          </View>
        </View>
        <Text style={styles.private}>Private to your account</Text>
      </View>
      <View style={styles.chart}>
        <View style={styles.chartHeader}>
          <Text style={styles.section}>Last six months</Text>
          <Text style={styles.meta}>Monthly totals</Text>
        </View>
        <View style={styles.bars}>
          {months.map((month) => (
            <View key={month.label} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(month.amount ? 8 : 0, (month.amount / maximum) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{month.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.form}>
        <Text style={styles.section}>Add earning</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What paid you?"
          placeholderTextColor={colours.slate}
          style={styles.input}
        />
        <View style={styles.formRow}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="£ amount"
            keyboardType="decimal-pad"
            placeholderTextColor={colours.slate}
            style={[styles.input, styles.half]}
          />
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colours.slate}
            style={[styles.input, styles.half]}
          />
        </View>
        <Pressable onPress={() => void add()} style={styles.primary}>
          <Text style={styles.primaryText}>Add earning</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {filtered.map((item) => (
          <Pressable
            key={item.id}
            onLongPress={() => remove(item)}
            style={styles.row}
          >
            <View style={styles.rowCopy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.earned_on} · Hold to delete</Text>
            </View>
            <Text style={styles.amount}>{money(item.amount_minor)}</Text>
          </Pressable>
        ))}
        {!filtered.length ? (
          <Text style={styles.empty}>
            No earnings recorded in this period yet.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  filter: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  filterActive: {
    backgroundColor: colours.mintPale,
    borderColor: colours.green,
  },
  filterText: { color: colours.slate, fontSize: 11, fontWeight: "700" },
  filterTextActive: { color: colours.green },
  total: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colours.navy,
    gap: 5,
  },
  totalLabel: {
    color: colours.mint,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  totalValue: { color: "white", fontSize: 36, fontWeight: "900" },
  stats: { flexDirection: "row", gap: spacing.xl, marginTop: spacing.sm },
  statValue: { color: "white", fontSize: 16, fontWeight: "900" },
  statLabel: { color: "#C8D7E3", fontSize: 10 },
  private: { color: "#C8D7E3", fontSize: 11, marginTop: spacing.sm },
  chart: {
    height: 230,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  bars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    paddingTop: spacing.md,
  },
  barColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  barTrack: {
    flex: 1,
    width: "68%",
    justifyContent: "flex-end",
    borderRadius: 5,
    backgroundColor: "#EDF2F2",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    minHeight: 2,
    borderRadius: 5,
    backgroundColor: colours.mint,
  },
  barLabel: { color: colours.slate, fontSize: 9 },
  form: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  section: { color: colours.ink, fontSize: 17, fontWeight: "800" },
  formRow: { flexDirection: "row", gap: spacing.sm },
  input: {
    height: 46,
    paddingHorizontal: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#C4D0D7",
    color: colours.ink,
    fontSize: 16,
  },
  half: { flex: 1, minWidth: 0 },
  primary: {
    minHeight: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colours.green,
  },
  primaryText: { color: "white", fontWeight: "800" },
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  rowCopy: { flex: 1 },
  title: { color: colours.ink, fontWeight: "800" },
  meta: { color: colours.slate, fontSize: 11, marginTop: 3 },
  amount: { color: colours.green, fontSize: 16, fontWeight: "900" },
  empty: { color: colours.slate, textAlign: "center", padding: spacing.xl },
});
