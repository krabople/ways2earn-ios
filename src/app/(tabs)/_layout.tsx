import { Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { type ColorValue, StyleSheet } from 'react-native';

import { colours } from '@/lib/theme';
import { useApp } from '@/providers/app-provider';

const tabSymbols: Record<string, SymbolViewProps['name']> = {
  discover: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  discuss: { ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' },
  post: { ios: 'plus.circle', android: 'add_circle', web: 'add_circle' },
  alerts: { ios: 'bell', android: 'notifications', web: 'notifications' },
  account: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
};

const Icon = ({ name, colour }: { name: keyof typeof tabSymbols; colour: ColorValue }) => (
  <SymbolView name={tabSymbols[name]} tintColor={colour} size={24} weight="semibold" />
);

export default function TabsLayout() {
  const { feed } = useApp();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colours.green, tabBarInactiveTintColor: colours.slate, tabBarStyle: styles.bar, tabBarLabelStyle: styles.label }}>
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: ({ color }) => <Icon name="discover" colour={color} /> }} />
      <Tabs.Screen name="community" options={{ title: 'Discuss', tabBarIcon: ({ color }) => <Icon name="discuss" colour={color} /> }} />
      <Tabs.Screen name="submit" options={{ title: 'Post', tabBarIcon: ({ color }) => <Icon name="post" colour={color} /> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarBadge: feed?.unread || undefined, tabBarIcon: ({ color }) => <Icon name="alerts" colour={color} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color }) => <Icon name="account" colour={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { height: 84, paddingTop: 8, borderTopColor: colours.line, backgroundColor: colours.surface },
  label: { fontSize: 11, fontWeight: '700', paddingBottom: 5 },
});
