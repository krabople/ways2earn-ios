import type { PropsWithChildren, ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colours, spacing } from '@/lib/theme';

export function Brand() {
  return <Text accessibilityRole="header" style={styles.brand}>ways<Text style={styles.two}>2</Text>earn</Text>;
}

export function Screen({ children, title, action, refreshing, onRefresh }: PropsWithChildren<{
  title?: string;
  action?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}>) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        {title ? <Text style={styles.title}>{title}</Text> : <Brand />}
        {action}
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colours.green} /> : undefined}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.canvas },
  header: { minHeight: 58, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colours.surface, borderBottomColor: colours.line, borderBottomWidth: StyleSheet.hairlineWidth },
  brand: { color: colours.navy, fontSize: 24, fontWeight: '900', letterSpacing: -1.1 },
  two: { color: colours.mint },
  title: { color: colours.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  content: { padding: spacing.lg, paddingBottom: 110, gap: spacing.lg },
});
