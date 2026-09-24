import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { MessageState } from "@/components/states";
import { assetUrl, request } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import type { Opportunity } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

type Report = {
  id: string;
  reason: string;
  details: string;
  status: string;
  reporter: string;
  target_type: string;
};
type AdminData = {
  finds: Opportunity[];
  reports: Report[];
  linkReviews: { id: string }[];
  comments: {
    id: string;
    author: string;
    title: string;
    status: string;
    body: string;
    kind: string;
  }[];
};
const fields: [keyof Opportunity, string][] = [
  ["title", "Title"],
  ["summary", "Summary"],
  ["body", "Details"],
  ["category", "Category"],
  ["reward", "Reward/value"],
  ["sourceUrl", "Source URL"],
  ["image", "Image"],
];

export default function ModerationScreen() {
  const { feed, action } = useApp();
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<"posts" | "reports" | "content">("posts");
  const [busy, setBusy] = useState("");
  const load = useCallback(
    async () => setData(await request<AdminData>("?view=admin")),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const pending = useMemo(
    () => data?.finds.filter((item) => item.status === "pending") ?? [],
    [data],
  );
  if (!feed?.user || feed.user.role === "member")
    return (
      <Screen title="Moderation" back>
        <MessageState
          title="Staff only"
          body="This area is available to moderators and administrators."
        />
      </Screen>
    );
  async function decide(id: string, decision: "published" | "rejected") {
    setBusy(id);
    try {
      await action({
        action: "moderate",
        kind: "opportunity",
        id,
        decision,
        note:
          decision === "published"
            ? ""
            : "Not approved from mobile moderation.",
      });
      await load();
    } catch (problem) {
      Alert.alert(
        "Could not update post",
        problem instanceof Error ? problem.message : "Please try again.",
      );
    } finally {
      setBusy("");
    }
  }
  async function report(id: string, decision: "resolved" | "dismissed") {
    setBusy(id);
    try {
      await action({
        action: "moderate",
        kind: "report",
        id,
        decision,
        note:
          decision === "resolved"
            ? "Actioned by the moderation team."
            : "No breach found.",
      });
      await load();
    } finally {
      setBusy("");
    }
  }
  return (
    <Screen
      title="Moderation"
      back
      refreshing={!data}
      onRefresh={() => void load()}
    >
      <View style={styles.summary}>
        <Text style={styles.kicker}>REVIEW QUEUE</Text>
        <Text style={styles.summaryTitle}>
          {pending.length} pending posts ·{" "}
          {data?.reports.filter((item) =>
            ["open", "reviewing"].includes(item.status),
          ).length ?? 0}{" "}
          open reports
        </Text>
      </View>
      <View style={styles.tabs}>
        {(
          [
            ["posts", "Posts"],
            ["reports", "Reports"],
            ["content", "Content"],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === "posts" ? (
        <>
          {pending.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image
                source={{ uri: assetUrl(item.image) }}
                resizeMode="contain"
                style={styles.image}
              />
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>
                @{item.authorHandle} · {item.type} · {item.category}
              </Text>
              <Text style={styles.body}>{item.summary}</Text>
              {item.editSnapshot ? (
                <View style={styles.changes}>
                  <Text style={styles.changeTitle}>
                    Changes awaiting approval
                  </Text>
                  {fields.map(([key, label]) => {
                    const before = item.editSnapshot?.[key as string];
                    const after = item[key];
                    return before !== undefined &&
                      JSON.stringify(before) !== JSON.stringify(after) ? (
                      <View key={String(key)} style={styles.change}>
                        <Text style={styles.changeLabel}>{label}</Text>
                        <Text numberOfLines={2} style={styles.before}>
                          Before: {String(before || "Blank")}
                        </Text>
                        <Text numberOfLines={2} style={styles.after}>
                          After: {String(after || "Blank")}
                        </Text>
                      </View>
                    ) : null;
                  })}
                </View>
              ) : null}
              <View style={styles.actions}>
                <Pressable
                  disabled={busy === item.id}
                  onPress={() => void decide(item.id, "published")}
                  style={styles.approve}
                >
                  <Text style={styles.approveText}>Publish</Text>
                </Pressable>
                <Pressable
                  disabled={busy === item.id}
                  onPress={() => void decide(item.id, "rejected")}
                  style={styles.reject}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {!pending.length ? (
            <MessageState
              title="Queue clear"
              body="There are no posts waiting for review."
            />
          ) : null}
        </>
      ) : null}
      {tab === "reports" ? (
        <>
          {data?.reports
            .filter((item) => ["open", "reviewing"].includes(item.status))
            .map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.reason}</Text>
                <Text style={styles.meta}>
                  Reported by {item.reporter} · {item.target_type}
                </Text>
                <Text style={styles.body}>
                  {item.details || "No additional details supplied."}
                </Text>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => void report(item.id, "resolved")}
                    style={styles.approve}
                  >
                    <Text style={styles.approveText}>Resolve</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void report(item.id, "dismissed")}
                    style={styles.reject}
                  >
                    <Text style={styles.rejectText}>Dismiss</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          {!data?.reports.some((item) =>
            ["open", "reviewing"].includes(item.status),
          ) ? (
            <MessageState
              title="No open reports"
              body="Member reports will appear here."
            />
          ) : null}
        </>
      ) : null}
      {tab === "content" ? (
        <>
          {data?.comments
            .filter((item) => item.status === "hidden")
            .map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.meta}>
                  {item.kind} by {item.author}
                </Text>
                <Text style={styles.body}>{item.body}</Text>
                <Pressable
                  onPress={() =>
                    void action({
                      action: "moderate",
                      kind:
                        item.kind === "discussion"
                          ? "discussion_reply"
                          : "comment",
                      id: item.id,
                      decision: "published",
                      note: "",
                    }).then(load)
                  }
                  style={styles.approve}
                >
                  <Text style={styles.approveText}>Restore</Text>
                </Pressable>
              </View>
            ))}
          {!data?.comments.some((item) => item.status === "hidden") ? (
            <MessageState
              title="Nothing hidden"
              body="Hidden comments and replies will appear here for review."
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colours.navy,
    gap: 5,
  },
  kicker: {
    color: colours.mint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  summaryTitle: { color: "white", fontSize: 16, fontWeight: "800" },
  tabs: { flexDirection: "row", gap: 6 },
  tab: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  tabActive: { borderColor: colours.green, backgroundColor: colours.mintPale },
  tabText: { color: colours.slate, fontWeight: "700" },
  tabTextActive: { color: colours.green },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
    gap: spacing.sm,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: radius.md,
    backgroundColor: "#F7F8F8",
  },
  cardTitle: {
    color: colours.ink,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  meta: { color: colours.slate, fontSize: 11 },
  body: { color: colours.ink, fontSize: 13, lineHeight: 20 },
  changes: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#F6F8F8",
  },
  changeTitle: { color: colours.ink, fontWeight: "900" },
  change: {
    gap: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colours.line,
    paddingTop: spacing.sm,
  },
  changeLabel: { color: colours.green, fontSize: 11, fontWeight: "900" },
  before: { color: "#87514B", fontSize: 11 },
  after: { color: colours.green, fontSize: 11 },
  actions: { flexDirection: "row", gap: spacing.sm },
  approve: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colours.green,
  },
  approveText: { color: "white", fontWeight: "900" },
  reject: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#D8B0AB",
  },
  rejectText: { color: "#9A3E35", fontWeight: "800" },
});
