import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { assetUrl } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import type { Opportunity } from "@/lib/types";
import { age } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

export function OpportunityCard({ item }: { item: Opportunity }) {
  const { action, signedIn } = useApp();
  const expired = item.status === "expired";

  async function vote(value: -1 | 1) {
    if (!signedIn) return;
    await Haptics.selectionAsync();
    await action({
      action: "vote",
      id: item.id,
      value: item.vote === value ? 0 : value,
    });
  }

  return (
    <View style={[styles.card, expired && styles.expired]}>
      <View style={styles.vote}>
        <Pressable
          accessibilityLabel="Vote hotter"
          disabled={!signedIn}
          onPress={() => void vote(1)}
          style={[styles.voteButton, item.vote === 1 && styles.voteSelected]}
        >
          <Text style={styles.voteArrow}>⌃</Text>
        </Pressable>
        <Text style={styles.temperature}>{item.temperature}°</Text>
        <Text style={styles.heat}>
          {expired ? "EXPIRED" : item.temperature > 0 ? "HOT" : "NEW"}
        </Text>
        <Pressable
          accessibilityLabel="Vote colder"
          disabled={!signedIn}
          onPress={() => void vote(-1)}
          style={[styles.voteButton, item.vote === -1 && styles.voteSelected]}
        >
          <Text style={styles.voteArrow}>⌄</Text>
        </Pressable>
      </View>
      <Link href={`/opportunity/${item.slug}`} asChild>
        <Pressable style={styles.main}>
          <Image
            source={assetUrl(item.image)}
            style={styles.image as never}
            contentFit="contain"
            transition={180}
          />
          <View style={styles.copy}>
            <View style={styles.metaRow}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.meta}>{age(item.createdAt)}</Text>
            </View>
            <Text numberOfLines={2} style={styles.title}>
              {item.title}
            </Text>
            <Text numberOfLines={2} style={styles.summary}>
              {item.summary}
            </Text>
            <View style={styles.footer}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.reward}
              >
                {item.reward || item.requiredSpend || "View details"}
              </Text>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.footerMeta}
              >
                ◷ {item.effort || "Varies"} · ◯ {item.comments}
              </Text>
            </View>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colours.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.line,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: colours.navy,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  expired: { opacity: 0.58 },
  vote: { width: 46, alignItems: "center", justifyContent: "center", gap: 3 },
  voteButton: {
    width: 38,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colours.line,
    alignItems: "center",
    justifyContent: "center",
  },
  voteSelected: {
    borderColor: colours.coral,
    backgroundColor: colours.coralPale,
  },
  voteArrow: { color: colours.coral, fontSize: 19, fontWeight: "800" },
  temperature: { color: colours.coral, fontSize: 18, fontWeight: "800" },
  heat: {
    color: colours.coral,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 112,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    backgroundColor: "#F6F8F8",
    borderWidth: 1,
    borderColor: colours.line,
  },
  copy: { flex: 1, minWidth: 0, alignSelf: "stretch", gap: 4 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  category: { color: colours.green, fontSize: 12, fontWeight: "800" },
  meta: { color: colours.slate, fontSize: 11 },
  title: {
    color: colours.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
  },
  summary: { color: colours.slate, fontSize: 12, lineHeight: 17 },
  footer: {
    minWidth: 0,
    gap: 2,
    marginTop: "auto",
    paddingTop: 3,
  },
  reward: {
    width: "100%",
    color: colours.green,
    fontSize: 13,
    fontWeight: "800",
  },
  footerMeta: { width: "100%", color: colours.slate, fontSize: 11 },
});
