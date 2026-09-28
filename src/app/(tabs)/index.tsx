import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { OpportunityCard } from "@/components/opportunity-card";
import { Screen } from "@/components/screen";
import { MessageState } from "@/components/states";
import { getOpportunities } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import type { Opportunity } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

const types = ["Earn", "Freebie", "Deal"] as const;
const inactiveTabColour = "#E8EEF4";

export default function DiscoverScreen() {
  const { loading, error, refresh, action, signedIn } = useApp();
  const [type, setType] = useState<(typeof types)[number]>("Earn");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [showExpired, setShowExpired] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [hideError, setHideError] = useState("");
  const [items, setItems] = useState<Opportunity[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [hidden, setHidden] = useState<Opportunity[]>([]);
  const [hiddenNextOffset, setHiddenNextOffset] = useState<number | null>(null);
  const [hiddenLoading, setHiddenLoading] = useState(false);
  const [search, setSearch] = useState("");
  const generation = useRef(0);
  const loadingMore = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const loadFirst = useCallback(async () => {
    const current = ++generation.current;
    setPageLoading(true);
    setPageError("");
    setItems([]);
    setNextOffset(null);
    try {
      const page = await getOpportunities({ type, category, query: search, showExpired });
      if (current !== generation.current) return;
      setItems(page.items);
      setNextOffset(page.nextOffset);
      setCategories(["All", ...page.categories]);
    } catch (problem) {
      if (current === generation.current) setPageError(problem instanceof Error ? problem.message : "Could not load posts.");
    } finally {
      if (current === generation.current) setPageLoading(false);
    }
  }, [type, category, search, showExpired]);

  useEffect(() => { void loadFirst(); return () => { generation.current += 1; }; }, [loadFirst, signedIn]);

  const loadMore = useCallback(async () => {
    if (nextOffset === null || pageLoading || loadingMore.current || pageError) return;
    loadingMore.current = true;
    setMoreLoading(true);
    const current = generation.current;
    try {
      const page = await getOpportunities({ type, category, query: search, showExpired, offset: nextOffset });
      if (current !== generation.current) return;
      setItems((previous) => [...previous, ...page.items.filter((item) => !previous.some((old) => old.id === item.id))]);
      setNextOffset(page.nextOffset);
    } catch (problem) {
      if (current === generation.current) setPageError(problem instanceof Error ? problem.message : "Could not load more posts.");
    } finally {
      loadingMore.current = false;
      setMoreLoading(false);
    }
  }, [nextOffset, pageLoading, pageError, type, category, search, showExpired]);

  const loadHidden = useCallback(async (offset = 0) => {
    if (hiddenLoading) return;
    setHiddenLoading(true);
    try {
      const page = await getOpportunities({ mode: "hidden", offset });
      setHidden((previous) => offset ? [...previous, ...page.items] : page.items);
      setHiddenNextOffset(page.nextOffset);
    } catch (problem) {
      setHideError(problem instanceof Error ? problem.message : "Could not load hidden posts.");
    } finally { setHiddenLoading(false); }
  }, [hiddenLoading]);

  async function unhide(item: Opportunity) {
    try {
      await action({ action: "hidePost", id: item.id, hidden: false });
      setHidden((previous) => previous.filter((entry) => entry.id !== item.id));
      void loadFirst();
    } catch (problem) { setHideError(problem instanceof Error ? problem.message : "Could not unhide post."); }
  }

  async function onRefresh() {
    await Promise.all([refresh(), loadFirst(), ...(showHidden ? [loadHidden()] : [])]);
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <OpportunityCard item={item} onVoteChange={(updated) => setItems((previous) => previous.map((entry) => entry.id === updated.id ? updated : entry))} onHidden={() => { setItems((previous) => previous.filter((entry) => entry.id !== item.id)); if (showHidden) void loadHidden(); }} />}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        refreshing={loading || pageLoading}
        onRefresh={() => void onRefresh()}
        ListHeaderComponent={<View style={styles.controls}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>COMMUNITY-CHECKED IDEAS</Text>
        <Text style={styles.heading}>Find a better way to earn.</Text>
        <Text style={styles.subheading}>
          Useful opportunities, honest member outcomes and no pay-to-rank
          listings.
        </Text>
      </View>
      <TextInput
        accessibilityLabel="Search opportunities"
        placeholder="Search earning ideas and merchants"
        placeholderTextColor={colours.slate}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      <View style={styles.segment}>
        {types.map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              setType(item);
              setCategory("All");
            }}
            style={[
              styles.segmentButton,
              { backgroundColor: type === item ? colours.navy : inactiveTabColour },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: type === item ? colours.surface : colours.navy },
              ]}
            >
              {item === "Earn"
                ? "Earn money"
                : item === "Freebie"
                  ? "Freebies"
                  : "Deals"}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {categories.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.chip, category === item && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                category === item && styles.chipTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: showExpired }}
        onPress={() => setShowExpired((current) => !current)}
        style={styles.expiredControl}
      >
        <View style={[styles.checkbox, showExpired && styles.checkboxChecked]}>
          {showExpired ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <View style={styles.expiredCopy}>
          <Text style={styles.expiredLabel}>Show expired posts</Text>
          <Text style={styles.expiredHint}>
            Include older opportunities that are no longer active.
          </Text>
        </View>
      </Pressable>
      {error ? <MessageState title="Unable to refresh" body={error} /> : null}
      {signedIn ? (
        <View style={styles.hiddenSection}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showHidden }} onPress={() => { if (!showHidden) void loadHidden(); setShowHidden(!showHidden); }}>
            <Text style={styles.hiddenHeading}>Hidden posts {showHidden ? "▴" : "▾"}</Text>
          </Pressable>
          {showHidden ? hidden.length ? hidden.map((item) => (
            <View key={item.id} style={styles.hiddenRow}>
              <Text numberOfLines={2} style={styles.hiddenTitle}>{item.title}</Text>
              <Pressable accessibilityLabel={`Unhide ${item.title}`} onPress={() => void unhide(item)}>
                <Text style={styles.unhide}>Unhide</Text>
              </Pressable>
            </View>
          )) : !hiddenLoading ? <Text style={styles.expiredHint}>No hidden posts yet. Swipe left on a post to hide it.</Text> : null : null}
          {showHidden && hiddenNextOffset !== null ? <Pressable onPress={() => void loadHidden(hiddenNextOffset)}><Text style={styles.unhide}>Load more hidden posts</Text></Pressable> : null}
          {hideError ? <Text style={styles.expiredHint}>{hideError}</Text> : null}
        </View>
      ) : null}
      </View>}
        ListEmptyComponent={!pageLoading && !pageError ? (
        <MessageState
          title="Nothing matches yet"
          body="Try another category or clear your search."
        />
      ) : null}
        ListFooterComponent={moreLoading ? <ActivityIndicator color={colours.green} /> : pageError ? <Pressable onPress={() => void (items.length ? loadMore() : loadFirst())}><Text style={styles.unhide}>{pageError} Tap to retry.</Text></Pressable> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hiddenSection: { gap: 10, paddingVertical: 14 },
  feedContent: { padding: spacing.lg, paddingBottom: 110 },
  controls: { gap: spacing.lg, marginBottom: spacing.lg },
  separator: { height: spacing.md },
  hiddenHeading: { color: colours.ink, fontWeight: "700", fontSize: 14 },
  hiddenRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: colours.surface, borderRadius: radius.md },
  hiddenTitle: { flex: 1, color: colours.ink, fontSize: 13 },
  unhide: { color: colours.green, fontWeight: "800", fontSize: 13 },
  intro: { gap: 5 },
  eyebrow: {
    color: colours.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heading: {
    color: colours.ink,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1.1,
  },
  subheading: { color: colours.slate, fontSize: 14, lineHeight: 21 },
  search: {
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
    color: colours.ink,
    fontSize: 15,
  },
  segment: {
    flexDirection: "row",
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  segmentText: { color: colours.slate, fontWeight: "700", fontSize: 13 },
  chips: { gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  chipActive: { borderColor: colours.mint, backgroundColor: colours.mintPale },
  chipText: { color: colours.slate, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: colours.green },
  expiredControl: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: radius.md,
    backgroundColor: colours.surface,
  },
  checkbox: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#AAB8C2",
    borderRadius: 6,
    backgroundColor: colours.surface,
  },
  checkboxChecked: {
    borderColor: colours.green,
    backgroundColor: colours.green,
  },
  checkmark: { color: "white", fontSize: 15, fontWeight: "900" },
  expiredCopy: { flex: 1, minWidth: 0 },
  expiredLabel: { color: colours.ink, fontSize: 13, fontWeight: "800" },
  expiredHint: { color: colours.slate, fontSize: 10, marginTop: 2 },
});
