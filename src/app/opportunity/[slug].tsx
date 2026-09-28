import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";

import { MessageState } from "@/components/states";
import { Screen } from "@/components/screen";
import { CommunityBody } from "@/components/community-body";
import { CommentsThread } from "@/components/comments-thread";
import { API_ORIGIN, assetUrl, getOpportunity } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import { age, type Opportunity } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

export default function OpportunityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { signedIn, action } = useApp();
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const reasons = ["Expired", "Misleading terms", "Inappropriate or abusive", "Unsafe or suspicious", "Duplicate", "Other"];
  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try { const result = await getOpportunity(slug); setItem(result.item); setLoadError(""); }
    catch (problem) { setLoadError(problem instanceof Error ? problem.message : "Could not load this post."); }
    finally { setLoading(false); }
  }, [slug]);
  useEffect(() => { void reload(); }, [reload, signedIn]);
  if (loading && !item) return <Screen title="Opportunity"><MessageState title="Loading post" body="Please wait a moment." /></Screen>;
  if (!item)
    return (
      <Screen title="Opportunity">
        <MessageState
          title="Post unavailable"
          body={loadError || "It may be awaiting review or may have been removed."}
        />
      </Screen>
    );
  const expired = item.status === "expired";

  async function act(body: Record<string, unknown>) {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      await Haptics.selectionAsync();
      await action(body);
      await reload();
    } catch (problem) {
      Alert.alert(
        "Could not update",
        problem instanceof Error ? problem.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function visit() {
    if (!item?.sourceUrl) {
      Alert.alert(
        "Source unavailable",
        "This post does not currently have a website link.",
      );
      return;
    }
    await WebBrowser.openBrowserAsync(item.sourceUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: colours.green,
    });
  }
  async function submitReport() {
    if (!item) return;
    if (!reportReason) { Alert.alert("Choose a reason", "Please tell us why you're reporting this post."); return; }
    setBusy(true);
    try {
      await action({ action: "report", id: item.id, reason: reportReason, details: reportDetails.trim() });
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
      Alert.alert("Report sent", "A moderator will review your report.");
    } catch (problem) {
      Alert.alert("Could not send report", problem instanceof Error ? problem.message : "Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <Screen
      title="Opportunity"
      action={
        <Pressable onPress={() => router.back()}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      }
    >
      <View style={[styles.hero, expired && styles.expired]}>
        <Image
          source={assetUrl(item.image)}
          contentFit="contain"
          style={styles.image as never}
        />
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>Shared by <Text onPress={() => router.push({ pathname: "/member/[handle]", params: { handle: item.authorHandle } })} style={{ color: colours.green, fontWeight: "800" }}>@{item.authorHandle}</Text> · {age(item.createdAt)}</Text>
        <View style={styles.temperature}>
          <Pressable
            disabled={busy}
            onPress={() =>
              void act({
                action: "vote",
                id: item.id,
                value: item.vote === 1 ? 0 : 1,
              })
            }
            style={styles.vote}
          >
            <Text>⌃ Hot</Text>
          </Pressable>
          <Text style={styles.degrees}>{item.temperature}°</Text>
          <Pressable
            disabled={busy}
            onPress={() =>
              void act({
                action: "vote",
                id: item.id,
                value: item.vote === -1 ? 0 : -1,
              })
            }
            style={styles.vote}
          >
            <Text>⌄ Cold</Text>
          </Pressable>
        </View>
      </View>
      {item.disclosure && item.disclosure !== "None" ? (
        <View style={styles.disclosure}>
          <Text style={styles.disclosureTitle}>Affiliate disclosure</Text>
          <Text style={styles.body}>{item.disclosure}</Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Pressable onPress={() => void visit()} style={styles.primary}>
          <Text style={styles.primaryText}>
            {expired ? "Visit source anyway" : "Visit website"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            void act({ action: "bookmark", id: item.id, saved: !item.saved })
          }
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>
            {item.saved ? "Saved ✓" : "Save"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            void Share.share({
              title: item.title,
              message: `${item.title}\n${API_ORIGIN}/opportunities/${item.slug}`,
            })
          }
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>Share</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>At a glance</Text>
        <Fact
          label={item.type === "Deal" ? "Saving or value" : "Reward"}
          value={item.reward || "See source"}
        />
        <Fact label="Time needed" value={item.effort || "Varies"} />
        <Fact label="Eligibility" value={item.eligibility || "See source"} />
        <Fact label="How you receive it" value={item.payout || "See source"} />
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>How it works</Text>
        <CommunityBody body={item.body} style={styles.body} />
      </View>
      <View style={styles.trust}>
        <Text style={styles.trustKicker}>COMMUNITY CHECKS</Text>
        <Text style={styles.sectionTitle}>Why members trust this post</Text>
        <View style={styles.metrics}>
          <Metric value={String(item.confirmations)} label="worked" />
          <Metric value={String(item.failures)} label="didn’t work" />
          <Metric value={String(item.bookmarks)} label="saved" />
        </View>
        <Text style={styles.body}>
          Member outcomes are useful context, not independent verification or a
          guarantee. Always check the current terms at the source.
        </Text>
      </View>
      <CommentsThread kind="opportunity" id={item.id} />
      <Pressable
        onPress={() => signedIn ? setReportOpen(true) : router.push("/login")}
      >
        <Text style={styles.report}>Report this post</Text>
      </Pressable>
      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.reportCard}>
            <Text style={styles.sectionTitle}>Report this post</Text>
            <Text style={styles.body}>Choose what needs a moderator&apos;s attention.</Text>
            {reasons.map((reason) => <Pressable key={reason} accessibilityRole="radio" accessibilityState={{ selected: reportReason === reason }} onPress={() => setReportReason(reason)} style={[styles.reasonRow, reportReason === reason && styles.reasonSelected]}><Text style={styles.reasonText}>{reportReason === reason ? "◉" : "○"}  {reason}</Text></Pressable>)}
            <TextInput accessibilityLabel="Report details" placeholder="Add any useful details (optional)" placeholderTextColor={colours.slate} value={reportDetails} onChangeText={setReportDetails} multiline maxLength={3000} style={styles.reportInput} />
            <View style={styles.reportButtons}>
              <Pressable disabled={busy} onPress={() => setReportOpen(false)} style={styles.secondary}><Text style={styles.secondaryText}>Cancel</Text></Pressable>
              <Pressable disabled={busy || !reportReason} onPress={() => void submitReport()} style={[styles.primary, (busy || !reportReason) && styles.disabled]}><Text style={styles.primaryText}>Send report</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  done: { color: colours.green, fontWeight: "800" },
  hero: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
    gap: spacing.sm,
  },
  expired: { opacity: 0.58 },
  image: {
    width: "100%",
    height: 210,
    backgroundColor: "#F7F8F8",
    borderRadius: radius.md,
  },
  category: {
    color: colours.green,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  title: {
    color: colours.ink,
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 31,
    letterSpacing: -0.6,
  },
  meta: { color: colours.slate, fontSize: 12 },
  temperature: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  vote: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colours.coralPale,
  },
  degrees: { color: colours.coral, fontWeight: "900", fontSize: 20 },
  disclosure: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: "#FFF8E9",
    borderWidth: 1,
    borderColor: "#F0D9A7",
    gap: 4,
  },
  disclosureTitle: { color: colours.warning, fontWeight: "800" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  primary: {
    flexGrow: 1,
    minHeight: 49,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colours.mint,
  },
  primaryText: { color: colours.navy, fontWeight: "900" },
  secondary: {
    minHeight: 49,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  secondaryText: { color: colours.ink, fontWeight: "800" },
  card: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
    gap: spacing.md,
  },
  sectionTitle: { color: colours.ink, fontSize: 19, fontWeight: "800" },
  body: { color: colours.slate, fontSize: 14, lineHeight: 22 },
  fact: {
    gap: 3,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colours.line,
  },
  factLabel: { color: colours.slate, fontSize: 11, fontWeight: "700" },
  factValue: { color: colours.ink, fontSize: 14, fontWeight: "700" },
  trust: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colours.mintPale,
    gap: spacing.md,
  },
  trustKicker: {
    color: colours.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  metrics: {
    flexDirection: "row",
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colours.surface,
  },
  metric: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: "center",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colours.line,
  },
  metricValue: { color: colours.green, fontSize: 20, fontWeight: "900" },
  metricLabel: { color: colours.slate, fontSize: 10 },
  report: {
    color: colours.slate,
    fontSize: 12,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: spacing.lg, backgroundColor: "#102A4688" },
  reportCard: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colours.surface },
  reasonRow: { padding: spacing.md, borderWidth: 1, borderColor: colours.line, borderRadius: radius.sm },
  reasonSelected: { borderColor: colours.green, backgroundColor: colours.mintPale },
  reasonText: { color: colours.ink, fontSize: 14 },
  reportInput: { minHeight: 80, maxHeight: 150, padding: spacing.md, borderWidth: 1, borderColor: colours.line, borderRadius: radius.sm, textAlignVertical: "top", color: colours.ink },
  reportButtons: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  disabled: { opacity: 0.5 },
});
