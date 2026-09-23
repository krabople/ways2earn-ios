import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { colours, radius, spacing } from '@/lib/theme';
import { uploadImage } from '@/lib/api';
import { useApp } from '@/providers/app-provider';

const types = ['Earn', 'Freebie', 'Deal'] as const;
const categories = {
  Earn: ['Banking rewards', 'Survey panels', 'Cashback', 'Mystery shopping', 'User testing', 'Miscellaneous'],
  Freebie: ['Food & drink', 'Samples', 'Days out', 'Digital freebies', 'Home & garden', 'Miscellaneous'],
  Deal: ['Shopping', 'Vouchers', 'Tech & gaming', 'Home & garden', 'Food & drink', 'Travel', 'Subscriptions', 'Miscellaneous'],
} as const;

export default function SubmitScreen() {
  const { signedIn, action } = useApp();
  const [type, setType] = useState<(typeof types)[number]>('Earn');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [steps, setSteps] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Miscellaneous');
  const [reward, setReward] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [image, setImage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!signedIn) return <Screen title="Share a find"><View style={styles.signIn}><Text style={styles.title}>Sign in to contribute</Text><Text style={styles.help}>Accounts help us moderate submissions and let members update their own posts.</Text><Pressable style={styles.primary} onPress={() => router.push('/login')}><Text style={styles.primaryText}>Sign in</Text></Pressable></View></Screen>;

  async function submit() {
    setBusy(true);
    try {
      const result = await action<{ id: string; slug: string; status: string }>({ action: 'submit', type, title, summary, steps, url, category, reward, spend: type === 'Freebie' ? '£0' : 'See source', effort: type === 'Earn' ? 'Varies' : 'Quick', eligibility: 'See source for current eligibility', payout: type === 'Earn' ? 'See source' : 'Not applicable', disclosure: 'None', difficulty: 'Beginner', idCheck: false, image, imageUrl: image ? '' : imageUrl });
      setTitle(''); setSummary(''); setSteps(''); setUrl(''); setReward(''); setImage(''); setImageUrl('');
      Alert.alert('Sent for review', 'A moderator will check the source and details before your post goes live.', [{ text: 'OK', onPress: () => router.replace(`/opportunity/${result.slug}`) }]);
    } catch (problem) {
      Alert.alert('Could not submit', problem instanceof Error ? problem.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.85 });
    if (result.canceled) return;
    setBusy(true);
    try { setImage(await uploadImage(result.assets[0].uri)); setImageUrl(''); }
    catch (problem) { Alert.alert('Image upload failed', problem instanceof Error ? problem.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  function chooseType(next: (typeof types)[number]) { setType(next); setCategory(categories[next][0]); }

  return <Screen title="Share a find"><View style={styles.notice}><Text style={styles.noticeTitle}>Community first</Text><Text style={styles.help}>Personal referral and affiliate links are not allowed. Link to the official source and disclose any connection.</Text></View><View style={styles.segment}>{types.map((item) => <Pressable key={item} onPress={() => chooseType(item)} style={[styles.segmentButton, item === type && styles.segmentActive]}><Text style={item === type ? styles.segmentActiveText : styles.segmentText}>{item}</Text></Pressable>)}</View><View style={styles.form}><Field label="Title" value={title} onChangeText={setTitle} placeholder={type === 'Earn' ? 'What can members earn?' : type === 'Freebie' ? 'What is available free?' : 'What is the deal?'} /><Field label="Short summary" value={summary} onChangeText={setSummary} multiline placeholder="The important detail in one or two sentences" /><Field label={type === 'Earn' ? 'Steps and conditions' : 'How to claim it'} value={steps} onChangeText={setSteps} multiline placeholder="Explain the process, eligibility, costs and catches" /><Field label="Official source URL" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder="https://" /><View style={styles.field}><Text style={styles.label}>Category</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{categories[type].map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={category === item ? styles.chipActiveText : styles.chipText}>{item}</Text></Pressable>)}</ScrollView></View><Field label={type === 'Deal' ? 'Saving or value' : type === 'Freebie' ? 'Value' : 'Expected reward'} value={reward} onChangeText={setReward} placeholder="e.g. £25 or £10/month" /><View style={styles.field}><Text style={styles.label}>Post image</Text><Text style={styles.help}>Paste a direct HTTPS image link, or upload a photo instead. Linked images are preferred when the source permits it.</Text><Field label="Image URL (preferred)" value={imageUrl} onChangeText={(value) => { setImageUrl(value); if (value) setImage(''); }} autoCapitalize="none" keyboardType="url" placeholder="https://example.com/image.jpg" /><Pressable style={styles.secondary} onPress={() => void chooseImage()}><Text style={styles.secondaryText}>{image ? 'Choose a different image' : 'Upload from Photos'}</Text></Pressable>{image ? <Image source={{ uri: image.startsWith('http') ? image : `https://www.ways2earn.com${image}` }} style={styles.preview} resizeMode="contain" /> : null}</View><Pressable disabled={busy || title.length < 12 || summary.length < 30 || steps.length < 30 || !url.startsWith('http') || reward.trim().length < 1} onPress={() => void submit()} style={[styles.primary, (busy || title.length < 12 || summary.length < 30 || steps.length < 30 || !url.startsWith('http') || reward.trim().length < 1) && styles.disabled]}><Text style={styles.primaryText}>{busy ? 'Sending…' : 'Send for review'}</Text></Pressable></View></Screen>;
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) { const { label, multiline, ...input } = props; return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...input} multiline={multiline} style={[styles.input, multiline && styles.multiline]} placeholderTextColor={colours.slate} /></View>; }

const styles = StyleSheet.create({
  signIn: { padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colours.surface, borderWidth: 1, borderColor: colours.line, gap: spacing.md }, title: { color: colours.ink, fontSize: 21, fontWeight: '800' }, help: { color: colours.slate, fontSize: 13, lineHeight: 20 }, notice: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colours.mintPale, gap: 4 }, noticeTitle: { color: colours.green, fontWeight: '800' }, segment: { flexDirection: 'row', gap: 6 }, segmentButton: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface }, segmentActive: { borderColor: colours.green, backgroundColor: colours.mintPale }, segmentText: { color: colours.slate, fontWeight: '700' }, segmentActiveText: { color: colours.green, fontWeight: '800' }, form: { gap: spacing.lg }, field: { gap: 6 }, label: { color: colours.ink, fontSize: 13, fontWeight: '800' }, input: { minHeight: 48, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: '#C8D4DA', backgroundColor: colours.surface, color: colours.ink, fontSize: 16 }, multiline: { minHeight: 110, paddingTop: 13, textAlignVertical: 'top' }, chips: { gap: 8 }, chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface }, chipActive: { backgroundColor: colours.mintPale, borderColor: colours.green }, chipText: { color: colours.slate, fontSize: 12, fontWeight: '700' }, chipActiveText: { color: colours.green, fontSize: 12, fontWeight: '800' }, secondary: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colours.line, backgroundColor: colours.surface }, secondaryText: { color: colours.ink, fontWeight: '800' }, preview: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: '#F7F8F8' }, primary: { minHeight: 50, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colours.green }, primaryText: { color: 'white', fontSize: 15, fontWeight: '800' }, disabled: { opacity: 0.45 },
});
