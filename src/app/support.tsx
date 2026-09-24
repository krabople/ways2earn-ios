import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ArticleIntro, ArticleSection, Bullet, Paragraph } from '@/components/article';
import { Screen } from '@/components/screen';
import { colours, radius, spacing } from '@/lib/theme';
import { useApp } from '@/providers/app-provider';

const categories = ['Account or sign-in', 'Opportunity or payout', 'Safety concern', 'Submission review', 'Something else'] as const;

export default function SupportScreen() {
  const { signedIn, action } = useApp();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('Something else');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const result = await action<{ code: string }>({ action: 'support', subject: subject.trim(), category, body: body.trim() });
      setSubject(''); setBody('');
      Alert.alert('Support request sent', `Your reference is ${result.code}. Replies will appear in your alerts.`);
    } catch (problem) {
      Alert.alert('Could not send request', problem instanceof Error ? problem.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  return <Screen title="Contact support">
    <ArticleIntro kicker="PRIVATE HELP" title="Tell us what happened.">Account issues, moderation questions and safety concerns can be sent privately to the Ways2Earn team.</ArticleIntro>
    {!signedIn ? <ArticleSection title="Sign in to contact the team" tone="green"><Paragraph>Support requests are linked to your account so you can receive and read the reply securely.</Paragraph><Pressable style={styles.primary} onPress={() => router.push('/login')}><Text style={styles.primaryText}>Sign in</Text></Pressable></ArticleSection> : <View style={styles.form}>
      <View style={styles.field}><Text style={styles.label}>Subject</Text><TextInput value={subject} onChangeText={setSubject} maxLength={180} placeholder="Briefly describe the problem" placeholderTextColor={colours.slate} style={styles.input} /></View>
      <View style={styles.field}><Text style={styles.label}>Topic</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</ScrollView></View>
      <View style={styles.field}><Text style={styles.label}>How can we help?</Text><TextInput value={body} onChangeText={setBody} maxLength={8000} multiline placeholder="Include the relevant post and what happened. Do not include passwords or banking details." placeholderTextColor={colours.slate} style={[styles.input, styles.multiline]} /></View>
      <Pressable disabled={busy || subject.trim().length < 8 || body.trim().length < 20} onPress={() => void submit()} style={[styles.primary, (busy || subject.trim().length < 8 || body.trim().length < 20) && styles.disabled]}><Text style={styles.primaryText}>{busy ? 'Sending…' : 'Send support request'}</Text></Pressable>
    </View>}
    <ArticleSection title="If something may be unsafe" tone="navy"><Bullet light>Do not send money, codes or identity documents while you wait.</Bullet><Bullet light>Contact your bank immediately through its official app or number if payment details may be at risk.</Bullet><Bullet light>Report the original post or message as well, so moderators have the right context.</Bullet></ArticleSection>
  </Screen>;
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface },
  field: { gap: spacing.sm }, label: { color: colours.ink, fontSize: 13, fontWeight: '800' },
  input: { minHeight: 49, paddingHorizontal: 14, borderWidth: 1, borderColor: '#C4D0D7', borderRadius: radius.md, backgroundColor: colours.surface, color: colours.ink, fontSize: 16 },
  multiline: { minHeight: 145, paddingTop: 13, textAlignVertical: 'top' }, chips: { gap: spacing.sm },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface },
  chipActive: { borderColor: colours.green, backgroundColor: colours.mintPale }, chipText: { color: colours.slate, fontSize: 12, fontWeight: '700' }, chipTextActive: { color: colours.green },
  primary: { minHeight: 49, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colours.green }, primaryText: { color: 'white', fontWeight: '850' }, disabled: { opacity: 0.45 },
});
