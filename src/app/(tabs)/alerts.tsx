import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { MessageState } from '@/components/states';
import { colours, radius, spacing } from '@/lib/theme';
import { age } from '@/lib/types';
import { useApp } from '@/providers/app-provider';

export default function AlertsScreen() {
  const { feed, signedIn, action, loading, refresh } = useApp();
  if (!signedIn) return <Screen title="Alerts"><MessageState title="Your alerts live here" body="Sign in to see replies, mentions, messages and saved searches." /><Pressable style={styles.primary} onPress={() => router.push('/login')}><Text style={styles.primaryText}>Sign in</Text></Pressable></Screen>;
  const alerts = feed?.notifications ?? [];
  return <Screen title="Alerts" refreshing={loading} onRefresh={() => void refresh()} action={feed?.unread ? <Pressable onPress={() => void action({ action: 'readNotifications' })}><Text style={styles.readAll}>Mark all read</Text></Pressable> : null}><View style={styles.list}>{alerts.map((item) => { const payload = JSON.parse(item.payload_json) as { title: string; href: string }; return <Pressable key={item.id} onPress={() => void action({ action: 'readNotification', id: item.id }).then(() => router.push(payload.href as never))} style={[styles.alert, !item.read_at && styles.unread]}><View style={[styles.dot, item.read_at && styles.dotRead]} /><View style={styles.copy}><Text style={styles.title}>{payload.title}</Text><Text style={styles.meta}>{age(item.created_at)}</Text></View><Text style={styles.chevron}>›</Text></Pressable>; })}</View>{!alerts.length ? <MessageState title="You’re all caught up" body="Replies, mentions, moderation updates and alert matches will appear here." /> : null}</Screen>;
}

const styles = StyleSheet.create({
  readAll: { color: colours.green, fontWeight: '800', fontSize: 12 }, list: { gap: spacing.sm }, alert: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface }, unread: { borderColor: '#A8DFC9', backgroundColor: colours.mintPale }, dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colours.mint }, dotRead: { backgroundColor: '#C5CED3' }, copy: { flex: 1, gap: 4 }, title: { color: colours.ink, fontSize: 14, fontWeight: '700', lineHeight: 19 }, meta: { color: colours.slate, fontSize: 11 }, chevron: { color: colours.slate, fontSize: 27 }, primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colours.green }, primaryText: { color: 'white', fontWeight: '800' },
});
