import { Tabs } from 'expo-router';
import { type ColorValue, StyleSheet, Text } from 'react-native';

import { colours } from '@/lib/theme';
import { useApp } from '@/providers/app-provider';

const Icon = ({ glyph, colour }: { glyph: string; colour: ColorValue }) => <Text style={[styles.icon, { color: colour }]}>{glyph}</Text>;

export default function TabsLayout() {
  const { feed } = useApp();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colours.green, tabBarInactiveTintColor: colours.slate, tabBarStyle: styles.bar, tabBarLabelStyle: styles.label }}>
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: ({ color }) => <Icon glyph="⌕" colour={color} /> }} />
      <Tabs.Screen name="community" options={{ title: 'Discuss', tabBarIcon: ({ color }) => <Icon glyph="◌" colour={color} /> }} />
      <Tabs.Screen name="submit" options={{ title: 'Post', tabBarIcon: ({ color }) => <Icon glyph="＋" colour={color} /> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarBadge: feed?.unread || undefined, tabBarIcon: ({ color }) => <Icon glyph="♢" colour={color} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color }) => <Icon glyph="○" colour={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { height: 84, paddingTop: 8, borderTopColor: colours.line, backgroundColor: colours.surface },
  label: { fontSize: 11, fontWeight: '700', paddingBottom: 5 },
  icon: { fontSize: 25, fontWeight: '600' },
});
