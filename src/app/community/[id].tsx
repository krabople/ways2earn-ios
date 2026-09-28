import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { CommunityBody } from "@/components/community-body";
import { CommentsThread } from "@/components/comments-thread";
import { MessageState } from "@/components/states";
import { colours, radius, spacing } from "@/lib/theme";
import { age } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

export default function DiscussionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { feed } = useApp();
  const topic = feed?.discussions.find((item) => item.id === id);
  if (!topic)
    return (
      <Screen title="Discussion" back>
        <MessageState
          title="Discussion unavailable"
          body="It may have been removed or may still be awaiting review."
        />
      </Screen>
    );
  return (
    <Screen title="Discussion" back>
      <View style={styles.card}>
        <Text style={styles.category}>{topic.category}</Text>
        <Text style={styles.title}>{topic.title}</Text>
        <Text style={styles.meta}>
          By @{topic.handle} · {age(topic.createdAt)}
        </Text>
        <CommunityBody body={topic.body} style={styles.body} />
      </View>
      <CommentsThread kind="discussion" id={topic.id} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
    gap: spacing.md,
  },
  category: { color: colours.green, fontSize: 12, fontWeight: "800" },
  title: {
    color: colours.ink,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
  },
  meta: { color: colours.slate, fontSize: 12 },
  body: { color: colours.ink, fontSize: 15, lineHeight: 24 },
});
