import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { OpportunityCard } from '@/components/opportunity-card';
import { Screen } from '@/components/screen';
import { MessageState } from '@/components/states';
import { colours, radius, spacing } from '@/lib/theme';
import { useApp } from '@/providers/app-provider';

const types = ['Earn', 'Freebie', 'Deal'] as const;

export default function DiscoverScreen() {
  const { feed, loading, error, refresh } = useApp();
  const [type, setType] = useState<(typeof types)[number]>('Earn');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const categories = useMemo(() => ['All', ...new Set((feed?.opportunities ?? []).filter((item) => item.type === type).map((item) => item.category))], [feed, type]);
  const items = useMemo(() => (feed?.opportunities ?? []).filter((item) => item.type === type && (category === 'All' || item.category === category) && (!query.trim() || `${item.title} ${item.summary} ${item.merchant}`.toLowerCase().includes(query.trim().toLowerCase()))), [category, feed, query, type]);

  return (
    <Screen refreshing={loading} onRefresh={() => void refresh()}>
      <View style={styles.intro}><Text style={styles.eyebrow}>COMMUNITY-CHECKED IDEAS</Text><Text style={styles.heading}>Find a better way to earn.</Text><Text style={styles.subheading}>Useful opportunities, honest member outcomes and no pay-to-rank listings.</Text></View>
      <TextInput accessibilityLabel="Search opportunities" placeholder="Search earning ideas and merchants" placeholderTextColor={colours.slate} value={query} onChangeText={setQuery} style={styles.search} />
      <View style={styles.segment}>{types.map((item) => <Pressable key={item} onPress={() => { setType(item); setCategory('All'); }} style={[styles.segmentButton, type === item && styles.segmentActive]}><Text style={[styles.segmentText, type === item && styles.segmentTextActive]}>{item === 'Earn' ? 'Earn money' : item === 'Freebie' ? 'Freebies' : 'Deals'}</Text></Pressable>)}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</ScrollView>
      {error ? <MessageState title="Unable to refresh" body={error} /> : null}
      <View style={styles.list}>{items.map((item) => <OpportunityCard key={item.id} item={item} />)}</View>
      {!loading && !items.length ? <MessageState title="Nothing matches yet" body="Try another category or clear your search." /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 5 }, eyebrow: { color: colours.green, fontSize: 11, fontWeight: '900', letterSpacing: 1 }, heading: { color: colours.ink, fontSize: 30, fontWeight: '900', letterSpacing: -1.1 }, subheading: { color: colours.slate, fontSize: 14, lineHeight: 21 },
  search: { height: 48, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface, color: colours.ink, fontSize: 15 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radius.md, backgroundColor: '#E7ECEF' }, segmentButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 }, segmentActive: { backgroundColor: colours.surface, shadowColor: colours.navy, shadowOpacity: 0.08, shadowRadius: 5 }, segmentText: { color: colours.slate, fontWeight: '700', fontSize: 13 }, segmentTextActive: { color: colours.green },
  chips: { gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface }, chipActive: { borderColor: colours.mint, backgroundColor: colours.mintPale }, chipText: { color: colours.slate, fontSize: 12, fontWeight: '700' }, chipTextActive: { color: colours.green }, list: { gap: spacing.md },
});
