import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "@/components/screen";
import { OpportunityCard } from "@/components/opportunity-card";
import { MessageState } from "@/components/states";
import { getOpportunities } from "@/lib/api";
import { colours, spacing } from "@/lib/theme";
import type { Opportunity } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

export default function SavedScreen() {
  const { signedIn } = useApp();
  const [saved, setSaved] = useState<Opportunity[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (offset = 0) => {
    if (!signedIn) return;
    if (offset) setMoreLoading(true); else setLoading(true);
    try {
      const page = await getOpportunities({ mode: "saved", offset });
      setSaved((previous) => offset ? [...previous, ...page.items.filter((item) => !previous.some((old) => old.id === item.id))] : page.items);
      setNextOffset(page.nextOffset);
      setError("");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not load saved posts."); }
    finally { setLoading(false); setMoreLoading(false); }
  }, [signedIn]);
  useEffect(() => { void load(); }, [load]);
  return (
    <Screen title="Saved opportunities" back scroll={false}>
      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => <OpportunityCard item={item} onVoteChange={(updated) => setSaved((previous) => previous.map((entry) => entry.id === updated.id ? updated : entry))} onHidden={() => void load()} />}
        onEndReached={() => { if (nextOffset !== null && !loading && !moreLoading) void load(nextOffset); }}
        onEndReachedThreshold={0.4}
        refreshing={loading}
        onRefresh={() => void load()}
        ListEmptyComponent={!loading ? (
        <MessageState
          title="Nothing saved yet"
          body="Tap Save on an opportunity to build a shortlist."
        />
      ) : null}
        ListFooterComponent={moreLoading ? <ActivityIndicator color={colours.green} /> : error ? <Pressable onPress={() => void load(saved.length ? nextOffset ?? 0 : 0)}><Text style={{ color: colours.green }}>{error} Tap to retry.</Text></Pressable> : null}
      />
    </Screen>
  );
}
