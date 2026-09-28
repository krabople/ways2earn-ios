import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { RichComposer } from "@/components/rich-composer";
import { plainCommunityText } from "@/components/community-body";
import { RichMessageBody } from "@/components/rich-message-body";
import { Screen } from "@/components/screen";
import { MessageState } from "@/components/states";
import { request } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import { age } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

type Conversation = {
  id: string;
  subject: string;
  participants: string;
  last_body: string;
  last_message_at: string;
  unread: number;
  participant_handles: string;
  blocked_by_me: number;
  messaging_blocked: number;
  administrative: number;
};
type ChatMessage = {
  id: string;
  sender_id: string;
  sender: string;
  handle: string;
  body: string;
  created_at: string;
};
type MessageData = { conversations: Conversation[]; messages: ChatMessage[]; activeId: string | null };

export default function MessagesScreen() {
  const params = useLocalSearchParams<{ id?: string; handle?: string }>();
  const { feed, signedIn, action } = useApp();
  const [data, setData] = useState<MessageData | null>(null);
  const [active, setActive] = useState<string | null>(params.id ?? null);
  const [recipient, setRecipient] = useState<string | null>(params.handle ?? null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [includeTranscript, setIncludeTranscript] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const load = useCallback(
    async (id?: string | null) => {
      try { const result = await request<MessageData>(
          `?view=messages${id ? `&id=${encodeURIComponent(id)}` : ""}`,
      ); setData(result); if (id && result.activeId && result.activeId !== id) setActive(result.activeId); setError(""); }
      catch (problem) { setError(problem instanceof Error ? problem.message : "Could not load messages."); }
    },
    [],
  );
  useEffect(() => {
    if (signedIn) void load(active);
  }, [active, signedIn, load]);
  useEffect(() => { if (params.id) { setActive(params.id); setRecipient(null); } else if (params.handle) { setRecipient(params.handle); setActive(null); } }, [params.id, params.handle]);
  useEffect(() => {
    if (!recipient || !data) return;
    const existing = data.conversations.find(item => item.participant_handles?.split(",").includes(recipient.toLowerCase()));
    if (existing) { setActive(existing.id); setRecipient(null); }
  }, [recipient, data]);
  useEffect(() => { if (signedIn && active) void action({ action: "readConversation", id: active }).catch(() => undefined); }, [active, signedIn, action]);
  useEffect(() => { if (active && data?.messages.length) scroll.current?.scrollToEnd({ animated: false }); }, [active, data]);
  async function open(id: string) {
    setRecipient(null);
    setActive(id);
    await action({ action: "readConversation", id });
    await load(id);
  }
  async function send() {
    if ((!active && !recipient) || body.trim().length < 2) return;
    setBusy(true);
    try {
      const sent = await action<{ id: string }>({ action: "sendMessage", ...(active ? { conversationId: active } : { recipient }), body });
      setBody("");
      setRecipient(null);
      setActive(sent.id);
      await load(sent.id);
    } catch (problem) {
      Alert.alert(
        "Could not send",
        problem instanceof Error ? problem.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const current = data?.conversations.find(item => item.id === active);
  const otherHandle = current?.participant_handles?.split(",")[0];
  async function toggleBlock() {
    if (!otherHandle || !current) return;
    try { await action({ action: "blockMember", handle: otherHandle, blocked: !Number(current.blocked_by_me) }); await load(active); }
    catch (problem) { Alert.alert("Could not update block", problem instanceof Error ? problem.message : "Please try again."); }
  }
  async function report() {
    if (!active || !reason) return;
    setBusy(true);
    try { await action({ action: "reportConversation", conversationId: active, reason, details: details.trim(), includeTranscript }); setReporting(false); setReason(""); setDetails(""); setIncludeTranscript(false); Alert.alert("Report sent", "A moderator will review it."); }
    catch (problem) { Alert.alert("Could not report", problem instanceof Error ? problem.message : "Please try again."); }
    finally { setBusy(false); }
  }

  if (!signedIn) return <Screen title="Messages" back><MessageState title="Sign in to see messages" body="Your private conversations are available after sign-in." /><Pressable onPress={() => router.push("/login")} style={styles.primary}><Text style={styles.primaryText}>Sign in</Text></Pressable></Screen>;

  if (!active && !recipient)
    return (
      <Screen title="Messages" back>
        {error ? <Pressable onPress={() => void load()}><Text style={styles.error}>{error} Tap to retry.</Text></Pressable> : null}
        <View style={styles.list}>
          {data?.conversations.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => void open(item.id)}
              style={styles.conversation}
            >
              <View style={styles.avatar}>
                <Text>{item.participants?.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>
                  {item.participants || item.subject}
                </Text>
                <Text numberOfLines={1} style={styles.preview}>
                  {plainCommunityText(item.last_body || item.subject)}
                </Text>
                <Text style={styles.time}>
                  {item.last_message_at ? age(item.last_message_at) : ""}
                </Text>
              </View>
              {Number(item.unread) > 0 ? (
                <Text style={styles.badge}>{item.unread}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
        {!data?.conversations.length && !error ? (
          <MessageState
            title="No messages yet"
            body="Visit a member’s profile to start a conversation. Moderators can also contact you about a submission."
          />
        ) : null}
      </Screen>
    );

  return (
    <Screen
      title={recipient ? `Message @${recipient}` : current?.subject || "Conversation"}
      back
      scroll={false}
      action={
        <Pressable onPress={() => { setActive(null); setRecipient(null); setReporting(false); }}>
          <Text style={styles.back}>Inbox</Text>
        </Pressable>
      }
    >
      <KeyboardAvoidingView style={styles.chat} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={58}>
      {current ? <View style={styles.chatHeader}>
        <Pressable onPress={() => otherHandle && router.push({ pathname: "/member/[handle]", params: { handle: otherHandle } })}><Text style={styles.back}>@{otherHandle}</Text></Pressable>
        <View style={styles.headerActions}><Pressable onPress={() => setReporting(!reporting)}><Text style={styles.back}>Report</Text></Pressable><Pressable onPress={() => Alert.alert(Number(current.blocked_by_me) ? "Unblock member?" : "Block member?", "This changes who can message you.", [{ text: "Cancel", style: "cancel" }, { text: Number(current.blocked_by_me) ? "Unblock" : "Block", style: "destructive", onPress: () => void toggleBlock() }])}><Text style={styles.back}>{Number(current.blocked_by_me) ? "Unblock" : "Block"}</Text></Pressable></View>
      </View> : null}
      {reporting ? <ScrollView style={styles.report} keyboardShouldPersistTaps="handled"><Text style={styles.title}>Report this conversation</Text>{["Harassment or abuse", "Spam or scam", "Threats or unsafe behaviour", "Personal information", "Other"].map(value => <Pressable key={value} onPress={() => setReason(value)} style={styles.reason}><Text style={styles.preview}>{reason === value ? "◉" : "○"}  {value}</Text></Pressable>)}<TextInput multiline maxLength={1500} value={details} onChangeText={setDetails} placeholder="Details (optional)" style={styles.input} /><Pressable onPress={() => setIncludeTranscript(!includeTranscript)} style={styles.reason}><Text style={styles.preview}>{includeTranscript ? "☑" : "□"}  Include the last 200 messages in my report</Text></Pressable><Pressable disabled={!reason || busy} onPress={() => void report()} style={styles.primary}><Text style={styles.primaryText}>Send report</Text></Pressable></ScrollView> : <>
      <ScrollView ref={scroll} style={styles.messages} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        {(active && data?.activeId === active ? data.messages : []).map((message) => (
          <View
            key={message.id}
            style={[
              styles.message,
              message.sender_id === feed?.user?.id && styles.own,
            ]}
          >
            <View style={styles.messageMeta}>
              <Text onPress={() => router.push({ pathname: "/member/[handle]", params: { handle: message.handle } })} style={styles.messageSender}>
                {message.sender_id === feed?.user?.id ? "You" : message.sender}
              </Text>
              <Text style={styles.time}>{age(message.created_at)}</Text>
            </View>
            <RichMessageBody body={message.body} />
          </View>
        ))}
        {error ? <Pressable onPress={() => void load(active)}><Text style={styles.error}>{error} Tap to retry.</Text></Pressable> : null}
      </ScrollView>
      {Number(current?.messaging_blocked) > 0 && !Number(current?.administrative) ? <Text style={styles.error}>Messaging is unavailable between these accounts.</Text> :
      <View style={styles.composer}>
        <RichComposer
          value={body}
          onChange={setBody}
          placeholder="Write a private message…"
          minHeight={110}
          enableMentions={false}
        />
        <Pressable
          disabled={busy || body.trim().length < 2}
          onPress={() => void send()}
          style={[
            styles.primary,
            (busy || body.trim().length < 2) && styles.disabled,
          ]}
        >
          <Text style={styles.primaryText}>{busy ? "Sending…" : "Send"}</Text>
        </Pressable>
      </View>}
      </>}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  conversation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colours.mintPale,
  },
  copy: { flex: 1, gap: 2 },
  title: { color: colours.ink, fontWeight: "800" },
  preview: { color: colours.slate, fontSize: 12 },
  time: { color: colours.slate, fontSize: 10 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: colours.green,
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },
  back: { color: colours.green, fontWeight: "800" },
  chat: { flex: 1 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", padding: spacing.md, backgroundColor: colours.surface, borderBottomWidth: 1, borderColor: colours.line },
  headerActions: { flexDirection: "row", gap: spacing.lg },
  messages: { flex: 1 },
  thread: { gap: spacing.md, padding: spacing.md, flexGrow: 1, justifyContent: "flex-end" },
  message: {
    maxWidth: "86%",
    alignSelf: "flex-start",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
    gap: 5,
  },
  own: {
    alignSelf: "flex-end",
    backgroundColor: colours.mintPale,
    borderColor: "#B9E7D6",
  },
  messageMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  messageSender: { color: colours.ink, fontSize: 11, fontWeight: "800" },
  messageBody: { color: colours.ink, fontSize: 14, lineHeight: 20 },
  composer: {
    flexShrink: 0,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
  },
  primary: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colours.green,
  },
  primaryText: { color: "white", fontWeight: "800" },
  disabled: { opacity: 0.45 },
  error: { color: colours.coral, padding: spacing.md },
  input: { backgroundColor: colours.surface, borderColor: colours.line, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, margin: spacing.sm },
  report: { padding: spacing.lg },
  reason: { paddingVertical: spacing.sm },
});
