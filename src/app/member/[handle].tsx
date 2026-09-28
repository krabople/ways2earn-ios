import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { OpportunityCard } from "@/components/opportunity-card";
import { Screen } from "@/components/screen";
import { MessageState } from "@/components/states";
import { assetUrl, request } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import type { Opportunity } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

type ProfileData = {
  profile: { id: string; handle: string; name: string; bio: string | null; avatar_url: string | null; joined: string };
  following: boolean;
  blockedByMe: boolean;
  messagingBlocked: boolean;
  followers: number;
  finds: Opportunity[];
  nextOffset: number | null;
};

export default function MemberProfile() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { feed, signedIn, action } = useApp();
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!handle) return;
    try {
      setData(await request<ProfileData>(`?view=profile&handle=${encodeURIComponent(handle)}`));
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not load this profile.");
    }
  }, [handle]);
  useEffect(() => { void load(); }, [load]);
  async function change(body: Record<string, unknown>) {
    setBusy(true);
    try { await action(body); await load(); }
    catch (problem) { Alert.alert("Could not update profile", problem instanceof Error ? problem.message : "Please try again."); }
    finally { setBusy(false); }
  }
  const self = data?.profile.id === feed?.user?.id;
  return <Screen title={data?.profile.name || "Member profile"} back>
    {error ? <MessageState title="Profile unavailable" body={error} /> : null}
    {data ? <>
      <View style={styles.card}>
        {data.profile.avatar_url ? <Image source={assetUrl(data.profile.avatar_url)} style={styles.avatar} contentFit="cover" /> : <View style={styles.avatarFallback}><Text style={styles.initial}>{data.profile.name.slice(0, 1).toUpperCase()}</Text></View>}
        <Text style={styles.name}>{data.profile.name}</Text>
        <Text style={styles.muted}>@{data.profile.handle} · {data.followers} followers</Text>
        {data.profile.bio ? <Text style={styles.bio}>{data.profile.bio}</Text> : null}
        {!self ? <View style={styles.actions}>
          {!data.messagingBlocked ? <Pressable accessibilityRole="button" onPress={() => signedIn ? router.push({ pathname: "/messages", params: { handle: data.profile.handle } }) : router.push("/login")} style={styles.primary}><Text style={styles.primaryText}>Message</Text></Pressable> : null}
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => signedIn ? void change({ action: "follow", handle: data.profile.handle, following: !data.following }) : router.push("/login")} style={styles.secondary}><Text style={styles.secondaryText}>{data.following ? "Following" : "Follow"}</Text></Pressable>
          {signedIn ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => Alert.alert(data.blockedByMe ? "Unblock member?" : "Block member?", data.blockedByMe ? "They will be able to message you again." : "You will no longer be able to message each other. Their comments will be hidden for you.", [{ text: "Cancel", style: "cancel" }, { text: data.blockedByMe ? "Unblock" : "Block", style: "destructive", onPress: () => void change({ action: "blockMember", handle: data.profile.handle, blocked: !data.blockedByMe }) }])} style={styles.secondary}><Text style={styles.secondaryText}>{data.blockedByMe ? "Unblock" : "Block"}</Text></Pressable> : null}
        </View> : null}
        {data.messagingBlocked && !self ? <Text style={styles.muted}>Messaging is unavailable between these accounts.</Text> : null}
      </View>
      <Text style={styles.heading}>Shared opportunities</Text>
      {data.finds.map(item => <OpportunityCard key={item.id} item={item} onVoteChange={updated => setData(current => current ? { ...current, finds: current.finds.map(post => post.id === updated.id ? updated : post) } : current)} />)}
      {data.nextOffset !== null ? <Pressable style={styles.secondary} onPress={() => void request<ProfileData>(`?view=profile&handle=${encodeURIComponent(handle)}&offset=${data.nextOffset}`).then(next => setData(current => current ? { ...current, finds: [...current.finds, ...next.finds], nextOffset: next.nextOffset } : next)).catch(problem => Alert.alert("Could not load posts", problem instanceof Error ? problem.message : "Please try again."))}><Text style={styles.secondaryText}>Load more</Text></Pressable> : null}
    </> : !error ? <Text style={styles.muted}>Loading profile…</Text> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, borderWidth: 1, borderColor: colours.line, borderRadius: radius.lg, backgroundColor: colours.surface, gap: spacing.sm },
  avatar: { width: 68, height: 68, borderRadius: 34 },
  avatarFallback: { width: 68, height: 68, borderRadius: 34, backgroundColor: colours.mintPale, alignItems: "center", justifyContent: "center" },
  initial: { color: colours.green, fontWeight: "900", fontSize: 28 },
  name: { color: colours.ink, fontSize: 24, fontWeight: "900" },
  muted: { color: colours.slate }, bio: { color: colours.ink, lineHeight: 21 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  primary: { backgroundColor: colours.navy, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  primaryText: { color: "white", fontWeight: "800" },
  secondary: { borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  secondaryText: { color: colours.ink, fontWeight: "800" },
  heading: { color: colours.ink, fontSize: 18, fontWeight: "800" },
});
