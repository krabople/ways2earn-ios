import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/components/screen';
import { colours, radius, spacing } from '@/lib/theme';
import { useApp } from '@/providers/app-provider';

export default function LoginScreen() {
  const { signIn } = useApp();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError('');
    try { await signIn(login.trim(), password); router.back(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Sign-in failed.'); }
    finally { setBusy(false); }
  }

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}><View style={styles.header}><Brand /><Pressable accessibilityLabel="Close sign in" onPress={() => router.back()}><Text style={styles.close}>×</Text></Pressable></View><View style={styles.card}><Text style={styles.kicker}>WELCOME BACK</Text><Text style={styles.title}>Sign in to Ways2Earn</Text><Text style={styles.help}>Use the same username, email and password as the website.</Text><View style={styles.field}><Text style={styles.label}>Username or email</Text><TextInput autoCapitalize="none" autoCorrect={false} textContentType="username" value={login} onChangeText={setLogin} style={styles.input} /></View><View style={styles.field}><Text style={styles.label}>Password</Text><TextInput secureTextEntry textContentType="password" value={password} onChangeText={setPassword} style={styles.input} /></View>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<Pressable disabled={busy || !login || !password} onPress={() => void submit()} style={[styles.primary, (busy || !login || !password) && styles.disabled]}><Text style={styles.primaryText}>{busy ? 'Signing in…' : 'Sign in securely'}</Text></Pressable><Text style={styles.security}>Your password is sent only to Ways2Earn over HTTPS and is never stored on this device.</Text></View></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.canvas }, page: { flex: 1, padding: spacing.lg }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, close: { color: colours.slate, fontSize: 34, fontWeight: '300' }, card: { marginTop: 50, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface, gap: spacing.lg }, kicker: { color: colours.green, fontSize: 11, fontWeight: '900', letterSpacing: 1 }, title: { color: colours.ink, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 }, help: { color: colours.slate, fontSize: 13, lineHeight: 19 }, field: { gap: 6 }, label: { color: colours.ink, fontSize: 13, fontWeight: '800' }, input: { height: 50, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: '#C4D0D7', color: colours.ink, fontSize: 16 }, error: { color: '#A63E34', lineHeight: 19 }, primary: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colours.green }, primaryText: { color: 'white', fontWeight: '800' }, disabled: { opacity: 0.45 }, security: { color: colours.slate, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
