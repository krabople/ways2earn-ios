import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { CommunityBody } from "@/components/community-body";
import { RichComposer } from "@/components/rich-composer";
import { MessageState } from "@/components/states";
import { request } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import { age } from "@/lib/types";
import { useApp } from "@/providers/app-provider";

type Comment = {
  id: string;
  author: string;
  handle: string;
  body: string;
  parentId: string | null;
  createdAt: string;
  blockedByViewer: boolean;
  reactions: { reaction: string; count: number; mine: boolean }[];
};

const reactions = [
  ["helpful", "👍", "Helpful"],
  ["laugh", "😄", "Funny"],
  ["thanks", "🙏", "Thanks"],
  ["insightful", "💡", "Insightful"],
] as const;
type Sort = "oldest" | "newest";

export function CommentsThread({
  kind,
  id,
}: {
  kind: "opportunity" | "discussion";
  id: string;
}) {
  const { signedIn, action } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<Sort>("oldest");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const result = await request<{ comments: Comment[] }>(
        `?view=comments&kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`,
      );
      setComments(result.comments);
      setError("");
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : "Could not load comments.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, kind]);
  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const ordered = useMemo(() => {
    const byId = new Map(comments.map((comment) => [comment.id, comment]));
    const compare = (a: Comment, b: Comment) =>
      sort === "oldest"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt);
    const children = new Map<string, Comment[]>();
    const roots: Comment[] = [];
    for (const comment of comments) {
      if (comment.parentId && byId.has(comment.parentId)) {
        const siblings = children.get(comment.parentId) ?? [];
        siblings.push(comment);
        children.set(comment.parentId, siblings);
      } else roots.push(comment);
    }
    const output: { comment: Comment; depth: number }[] = [];
    const seen = new Set<string>();
    function visit(comment: Comment, depth: number) {
      if (seen.has(comment.id)) return;
      seen.add(comment.id);
      output.push({ comment, depth });
      for (const child of (children.get(comment.id) ?? []).sort(compare))
        visit(child, Math.min(depth + 1, 2));
    }
    for (const root of roots.sort(compare)) visit(root, 0);
    for (const comment of [...comments].sort(compare)) visit(comment, 0);
    return output;
  }, [comments, sort]);

  async function submit() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      await action({
        action: "comment",
        kind,
        id,
        body,
        parentId: replyTo?.id ?? null,
      });
      setBody("");
      setReplyTo(null);
      await load();
    } catch (problem) {
      Alert.alert(
        "Could not post",
        problem instanceof Error ? problem.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function react(comment: Comment, reaction: string, selected: boolean) {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    try {
      await action({
        action: "react",
        kind,
        id: comment.id,
        reaction,
        selected,
      });
      await load();
    } catch (problem) {
      Alert.alert(
        "Could not react",
        problem instanceof Error ? problem.message : "Please try again.",
      );
    }
  }

  return (
    <View style={styles.thread}>
      <View style={styles.heading}>
        <Text style={styles.title}>
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </Text>
        <View style={styles.sort}>
          {(["oldest", "newest"] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: sort === value }}
              onPress={() => setSort(value)}
              style={[styles.sortButton, sort === value && styles.sortActive]}
            >
              <Text
                style={[
                  styles.sortText,
                  sort === value && styles.sortTextActive,
                ]}
              >
                {value === "oldest" ? "Oldest" : "Newest"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {loading ? <Text style={styles.muted}>Loading comments…</Text> : null}
      {error ? (
        <Pressable onPress={() => void load()}>
          <Text style={styles.error}>{error} Tap to retry.</Text>
        </Pressable>
      ) : null}
      <View style={styles.list}>
        {ordered.map(({ comment, depth }) => (
          <View
            key={comment.id}
            style={[styles.comment, depth > 0 && styles.reply]}
          >
            {comment.blockedByViewer ? (
              <Text style={styles.blocked}>Comment from a blocked member</Text>
            ) : (
              <>
                <View style={styles.meta}>
                  <Text style={styles.author}>{comment.author}</Text>
                  <Text style={styles.time}>
                    @{comment.handle} · {age(comment.createdAt)}
                  </Text>
                </View>
                <CommunityBody body={comment.body} style={styles.body} />
                <View style={styles.actions}>
                  <Pressable onPress={() => setReplyTo(comment)}>
                    <Text style={styles.action}>Reply</Text>
                  </Pressable>
                  {reactions.map(([reaction, emoji, label]) => {
                    const state = comment.reactions?.find(
                      (item) => item.reaction === reaction,
                    );
                    return (
                      <Pressable
                        key={reaction}
                        accessibilityLabel={label}
                        accessibilityState={{ selected: Boolean(state?.mine) }}
                        onPress={() =>
                          void react(comment, reaction, !state?.mine)
                        }
                      >
                        <Text
                          style={[
                            styles.reaction,
                            state?.mine && styles.reactionMine,
                          ]}
                        >
                          {emoji} {state?.count || ""}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        "Report comment?",
                        "A moderator will review it.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Report",
                            style: "destructive",
                            onPress: () =>
                              void action({
                                action: "reportComment",
                                kind,
                                id: comment.id,
                                reason: "Reported from the iOS app.",
                              }),
                          },
                        ],
                      )
                    }
                  >
                    <Text style={styles.report}>Report</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ))}
      </View>
      {!loading && !comments.length && !error ? (
        <MessageState
          title="No comments yet"
          body="Start a useful, respectful conversation."
        />
      ) : null}
      <View style={styles.composer}>
        {replyTo ? (
          <View style={styles.replying}>
            <Text style={styles.replyingText}>
              Replying to @{replyTo.handle}
            </Text>
            <Pressable
              accessibilityLabel="Cancel reply"
              onPress={() => setReplyTo(null)}
            >
              <Text>×</Text>
            </Pressable>
          </View>
        ) : null}
        {signedIn ? (
          <RichComposer
            value={body}
            onChange={setBody}
            placeholder="Share your experience or ask a question…"
          />
        ) : (
          <Pressable
            onPress={() => router.push("/login")}
            style={styles.signIn}
          >
            <Text style={styles.action}>Sign in to join the discussion</Text>
          </Pressable>
        )}
        <Text style={styles.hint}>
          Be kind and don’t share personal referral links.
        </Text>
        <Pressable
          disabled={busy || (signedIn && body.trim().length < 2)}
          onPress={() => void submit()}
          style={[
            styles.primary,
            (busy || (signedIn && body.trim().length < 2)) && styles.disabled,
          ]}
        >
          <Text style={styles.primaryText}>
            {busy
              ? "Posting…"
              : signedIn
                ? "Post comment"
                : "Sign in to comment"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  thread: { gap: spacing.lg },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  title: { color: colours.ink, fontSize: 20, fontWeight: "800" },
  sort: { flexDirection: "row", gap: 4 },
  sortButton: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
  },
  sortActive: { backgroundColor: colours.mintPale, borderColor: colours.green },
  sortText: { color: colours.slate, fontSize: 11, fontWeight: "700" },
  sortTextActive: { color: colours.green },
  muted: { color: colours.slate },
  error: { color: colours.coral },
  list: { gap: spacing.md },
  comment: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
    gap: spacing.sm,
  },
  reply: {
    marginLeft: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colours.mint,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  author: { color: colours.ink, fontWeight: "800" },
  time: { color: colours.slate, fontSize: 11 },
  body: { color: colours.ink, fontSize: 14, lineHeight: 23 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  action: { color: colours.green, fontSize: 12, fontWeight: "700" },
  reaction: {
    color: colours.slate,
    fontSize: 12,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "#F4F7F7",
  },
  reactionMine: { color: colours.green, backgroundColor: colours.mintPale },
  report: { color: colours.slate, fontSize: 12 },
  blocked: { color: colours.slate, fontStyle: "italic" },
  composer: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
  },
  replying: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colours.mintPale,
  },
  replyingText: { color: colours.green, fontSize: 12, fontWeight: "800" },
  hint: { color: colours.slate, fontSize: 10, lineHeight: 15 },
  signIn: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: radius.md,
  },
  primary: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colours.green,
  },
  primaryText: { color: "white", fontWeight: "800" },
  disabled: { opacity: 0.45 },
});
