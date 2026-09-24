import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colours, radius, spacing } from '@/lib/theme';

export function ArticleIntro({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return <View style={styles.intro}><Text style={styles.kicker}>{kicker}</Text><Text style={styles.title}>{title}</Text><Text style={styles.lead}>{children}</Text></View>;
}

export function ArticleSection({ title, children, tone = 'plain' }: { title: string; children: ReactNode; tone?: 'plain' | 'green' | 'navy' }) {
  return <View style={[styles.section, tone === 'green' && styles.green, tone === 'navy' && styles.navy]}><Text style={[styles.heading, tone === 'navy' && styles.white]}>{title}</Text><View style={styles.copy}>{children}</View></View>;
}

export function Paragraph({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <Text style={[styles.paragraph, light && styles.light]}>{children}</Text>;
}

export function Bullet({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <View style={styles.bulletRow}><Text style={[styles.bullet, light && styles.light]}>•</Text><Text style={[styles.paragraph, styles.bulletText, light && styles.light]}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, paddingBottom: spacing.sm },
  kicker: { color: colours.green, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  title: { color: colours.ink, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -1 },
  lead: { color: colours.slate, fontSize: 15, lineHeight: 23 },
  section: { gap: spacing.md, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface },
  green: { borderColor: '#C4E7DA', backgroundColor: colours.mintPale },
  navy: { borderColor: colours.navy, backgroundColor: colours.navy },
  heading: { color: colours.ink, fontSize: 19, lineHeight: 25, fontWeight: '850' },
  white: { color: 'white' },
  copy: { gap: spacing.md },
  paragraph: { color: colours.slate, fontSize: 14, lineHeight: 22 },
  light: { color: '#D7E2EB' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bullet: { color: colours.green, width: 12, fontSize: 17, lineHeight: 22, fontWeight: '900' },
  bulletText: { flex: 1 },
});
