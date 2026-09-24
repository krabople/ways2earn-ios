import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { MessageState } from "@/components/states";
import { colours, radius, spacing } from "@/lib/theme";
import { age } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

export default function CommunityScreen() {
  const { feed, loading, refresh } = useApp();
  return (
    <Screen
      title="Community"
      refreshing={loading}
      onRefresh={() => void refresh()}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>ASK · SHARE · LEARN</Text>
        <Text style={styles.heroTitle}>Real experience from real members.</Text>
        <Text style={styles.heroCopy}>
          Compare outcomes, ask questions and help the community spot catches
          before they cost someone time or money.
        </Text>
      </View>
      <Text style={styles.section}>Latest discussions</Text>
      <View style={styles.list}>
        {feed?.discussions.map((topic) => (
          <Link
            key={topic.id}
            href={{
              pathname: "/community/[id]" as never,
              params: { id: topic.id },
            }}
            asChild
          >
            <Pressable style={styles.topic}>
              <View style={styles.bubble}>
                <Text>◌</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.category}>{topic.category}</Text>
                <Text style={styles.title}>{topic.title}</Text>
                <Text style={styles.meta}>
                  By @{topic.handle} · {topic.replies} replies ·{" "}
                  {age(topic.updatedAt)}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </Link>
        ))}
      </View>
      {!loading && !feed?.discussions.length ? (
        <MessageState
          title="No discussions yet"
          body="Start the first conversation from the Post tab."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colours.navy,
    gap: 7,
  },
  kicker: {
    color: colours.mint,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
  },
  heroCopy: { color: "#D6E2EC", fontSize: 13, lineHeight: 20 },
  section: { color: colours.ink, fontSize: 18, fontWeight: "800" },
  list: { gap: spacing.md },
  topic: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  bubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colours.mintPale,
  },
  copy: { flex: 1, gap: 3 },
  category: { color: colours.green, fontSize: 11, fontWeight: "800" },
  title: {
    color: colours.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  meta: { color: colours.slate, fontSize: 11 },
  chevron: { color: colours.slate, fontSize: 28 },
});
