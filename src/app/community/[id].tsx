import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { MessageState } from '@/components/states';
import { colours, radius, spacing } from '@/lib/theme';
import { age } from '@/lib/types';
import { useApp } from '@/providers/app-provider';

export default function DiscussionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { feed } = useApp(); const topic = feed?.discussions.find((item) => item.id === id);
  if (!topic) return <Screen title="Discussion"><MessageState title="Discussion unavailable" body="It may have been removed or may still be awaiting review." /></Screen>;
  return <Screen title="Discussion"><View style={styles.card}><Text style={styles.category}>{topic.category}</Text><Text style={styles.title}>{topic.title}</Text><Text style={styles.meta}>By @{topic.handle} · {age(topic.createdAt)}</Text><Text style={styles.body}>{topic.body}</Text></View><Pressable style={styles.primary} onPress={() => router.push({ pathname: '/comments/[kind]/[id]' as never, params: { kind: 'discussion', id: topic.id } })}><Text style={styles.primaryText}>View {topic.replies} replies</Text></Pressable></Screen>;
}
const styles = StyleSheet.create({ card: { padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colours.surface, borderWidth: 1, borderColor: colours.line, gap: spacing.md }, category: { color: colours.green, fontSize: 12, fontWeight: '800' }, title: { color: colours.ink, fontSize: 26, fontWeight: '900', lineHeight: 32 }, meta: { color: colours.slate, fontSize: 12 }, body: { color: colours.ink, fontSize: 15, lineHeight: 24 }, primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colours.green }, primaryText: { color: 'white', fontWeight: '800' } });
