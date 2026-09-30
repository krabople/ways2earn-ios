import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { CommunityBody } from "@/components/community-body";
import { CommentsThread } from "@/components/comments-thread";
import { MessageState } from "@/components/states";
import { colours, radius, spacing } from "@/lib/theme";
import { age } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

const reportReasons = ["Inappropriate content", "Spam or advertising", "Unsafe or suspicious", "Duplicate", "Other"];

export default function DiscussionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { feed, signedIn, action } = useApp();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const topic = feed?.discussions.find((item) => item.id === id);

  async function submitReport() {
    if (!topic || reportBusy) return;
    if (!signedIn) {
      setReportOpen(false);
      router.push("/login");
      return;
    }
    if (!reportReason) {
      Alert.alert("Choose a reason", "Please tell us why you're reporting this discussion.");
      return;
    }
    setReportBusy(true);
    try {
      await action({ action: "reportDiscussion", id: topic.id, reason: reportReason, details: reportDetails.trim() });
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
      Alert.alert("Report sent", "A moderator will review your report.");
    } catch (problem) {
      Alert.alert("Could not send report", problem instanceof Error ? problem.message : "Please try again.");
    } finally {
      setReportBusy(false);
    }
  }

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
        <Text style={styles.meta}>By <Text onPress={() => router.push({ pathname: "/member/[handle]", params: { handle: topic.handle } })} style={{ color: colours.green, fontWeight: "800" }}>@{topic.handle}</Text> · {age(topic.createdAt)}</Text>
        <CommunityBody body={topic.body} style={styles.body} />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => signedIn ? setReportOpen(true) : router.push("/login")}
        style={styles.reportLink}
      >
        <Text style={styles.reportLinkText}>Report this discussion</Text>
      </Pressable>
      <CommentsThread kind="discussion" id={topic.id} />
      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => { if (!reportBusy) setReportOpen(false); }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBackdrop}>
          <ScrollView style={styles.reportCard} contentContainerStyle={styles.reportContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <Text accessibilityRole="header" style={styles.reportTitle}>Report this discussion</Text>
            <Text style={styles.body}>Choose what needs a moderator&apos;s attention.</Text>
            {reportReasons.map((reason) => (
              <Pressable
                key={reason}
                accessibilityRole="radio"
                accessibilityState={{ selected: reportReason === reason, disabled: reportBusy }}
                disabled={reportBusy}
                onPress={() => setReportReason(reason)}
                style={[styles.reasonRow, reportReason === reason && styles.reasonSelected]}
              >
                <Text style={styles.reasonText}>{reportReason === reason ? "◉" : "○"}  {reason}</Text>
              </Pressable>
            ))}
            <TextInput
              accessibilityLabel="Report details"
              placeholder="Add any useful details (optional)"
              placeholderTextColor={colours.slate}
              value={reportDetails}
              onChangeText={setReportDetails}
              editable={!reportBusy}
              multiline
              maxLength={3000}
              style={styles.reportInput}
            />
            <View style={styles.reportButtons}>
              <Pressable accessibilityRole="button" disabled={reportBusy} onPress={() => setReportOpen(false)} style={[styles.secondary, reportBusy && styles.disabled]}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: reportBusy || !reportReason, busy: reportBusy }} disabled={reportBusy || !reportReason} onPress={() => void submitReport()} style={[styles.primary, (reportBusy || !reportReason) && styles.disabled]}>
                <Text style={styles.primaryText}>{reportBusy ? "Sending…" : "Send report"}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  reportLink: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  reportLinkText: { color: colours.slate, fontSize: 13, textDecorationLine: "underline" },
  modalBackdrop: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: 48, backgroundColor: "#102A4688" },
  reportCard: { width: "100%", maxWidth: 560, maxHeight: "100%", flexGrow: 0, flexShrink: 1, borderRadius: radius.lg, backgroundColor: colours.surface },
  reportContent: { padding: spacing.lg, gap: spacing.sm },
  reportTitle: { color: colours.ink, fontSize: 20, fontWeight: "800" },
  reasonRow: { minHeight: 44, padding: spacing.md, borderWidth: 1, borderColor: colours.line, borderRadius: radius.sm },
  reasonSelected: { borderColor: colours.green, backgroundColor: colours.mintPale },
  reasonText: { color: colours.ink, fontSize: 14 },
  reportInput: { minHeight: 100, maxHeight: 180, padding: spacing.md, borderWidth: 1, borderColor: colours.line, borderRadius: radius.sm, textAlignVertical: "top", color: colours.ink, fontSize: 15 },
  reportButtons: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: spacing.sm },
  primary: { minHeight: 44, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.sm, backgroundColor: colours.navy, justifyContent: "center" },
  primaryText: { color: colours.surface, fontWeight: "800", textAlign: "center" },
  secondary: { minHeight: 44, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.sm, borderWidth: 1, borderColor: colours.line, justifyContent: "center" },
  secondaryText: { color: colours.ink, fontWeight: "800", textAlign: "center" },
  disabled: { opacity: 0.5 },
});
