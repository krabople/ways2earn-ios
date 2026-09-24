import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { RichComposer } from "@/components/rich-composer";
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
};
type ChatMessage = {
  id: string;
  sender_id: string;
  sender: string;
  body: string;
  created_at: string;
};
type MessageData = { conversations: Conversation[]; messages: ChatMessage[] };

export default function MessagesScreen() {
  const { feed, action } = useApp();
  const [data, setData] = useState<MessageData | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(
    async (id?: string | null) =>
      setData(
        await request<MessageData>(
          `?view=messages${id ? `&id=${encodeURIComponent(id)}` : ""}`,
        ),
      ),
    [],
  );
  useEffect(() => {
    void load(active);
  }, [active, load]);
  async function open(id: string) {
    setActive(id);
    await action({ action: "readConversation", id });
  }
  async function send() {
    if (!active || body.trim().length < 2) return;
    setBusy(true);
    try {
      await action({ action: "sendMessage", conversationId: active, body });
      setBody("");
      await load(active);
    } catch (problem) {
      Alert.alert(
        "Could not send",
        problem instanceof Error ? problem.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!active)
    return (
      <Screen title="Messages" back>
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
                  {plain(item.last_body || item.subject)}
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
        {!data?.conversations.length ? (
          <MessageState
            title="No messages yet"
            body="Visit a member’s profile to start a conversation. Moderators can also contact you about a submission."
          />
        ) : null}
      </Screen>
    );

  return (
    <Screen
      title="Conversation"
      back
      action={
        <Pressable onPress={() => setActive(null)}>
          <Text style={styles.back}>Inbox</Text>
        </Pressable>
      }
    >
      <View style={styles.thread}>
        {data?.messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.message,
              message.sender_id === feed?.user?.id && styles.own,
            ]}
          >
            <View style={styles.messageMeta}>
              <Text style={styles.messageSender}>
                {message.sender_id === feed?.user?.id ? "You" : message.sender}
              </Text>
              <Text style={styles.time}>{age(message.created_at)}</Text>
            </View>
            <Text style={styles.messageBody}>{plain(message.body)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.composer}>
        <RichComposer
          value={body}
          onChange={setBody}
          placeholder="Write a private message…"
          minHeight={110}
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
      </View>
    </Screen>
  );
}

function plain(body: string) {
  return body
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "🖼 $1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[*_\\]/g, "")
    .trim();
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
  thread: { gap: spacing.md },
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
});
