import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/components/screen';
import { colours, radius, spacing } from '@/lib/theme';
import { useTutorial } from '@/providers/tutorial-provider';

const steps = [
  {
    area: 'DISCOVER',
    title: 'Find your kind of opportunity.',
    body: 'Switch between earning ideas, freebies and deals. Use search and category filters to narrow things down. You can browse without an account.',
    tip: 'Open a post to check the reward, any spending required and the conditions before you tap Visit website. Show expired posts brings older offers back into the feed.',
  },
  {
    area: 'YOUR FEED',
    title: 'Keep the good finds close.',
    body: 'Vote hot or cold with the arrows in the feed. Open a post and tap Save to keep it in Account → Saved opportunities. Swipe a feed post left to hide it.',
    tip: 'Changed your mind? Open Hidden posts at the top of Discover and tap Unhide. Saving, voting and hiding are available when you’re signed in.',
  },
  {
    area: 'ALERTS',
    title: 'Let good finds come to you.',
    body: 'Create an alert for a keyword, a whole category, or both. Matching new posts appear in Alerts after they’re published.',
    tip: 'Go to Account → Notification preferences → Create an alert. Email is optional. Turn on Push notifications in Account if you’d like alerts when the app is closed.',
  },
  {
    area: 'DISCUSS & MESSAGES',
    title: 'You don’t have to figure it out alone.',
    body: 'Read and sort replies below a post, then join in with a reply or reaction. The Discuss tab is for questions, experiences and advice.',
    tip: 'Tap a member’s name to open their profile and send a private message. Your inbox is in Account → Messages. You can report posts or comments, and report or block someone in a conversation.',
  },
  {
    area: 'POST',
    title: 'Share something worth finding.',
    body: 'Tap Post and choose Earn, Freebie, Deal or Discussion. Add a clear title and useful details. For an opportunity, include the website link and link to an image or upload one.',
    tip: 'The editor has formatting, links, images and community emojis. Use @ to find and mention someone in a public post or reply. New opportunities go to moderation before appearing in the feed.',
  },
  {
    area: 'ACCOUNT',
    title: 'Keep track of what pays off.',
    body: 'Use the private earnings tracker to record what you’ve earned and compare totals over time. Account also brings together your saved opportunities, messages and notification preferences.',
    tip: 'Sign in with the same account on the app and website to use your posts, saved finds and conversations in both places. Trust centre and Contact support are in Account whenever you need them.',
  },
] as const;

export default function TutorialScreen() {
  const { markSeen } = useTutorial();
  const [step, setStep] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const closing = useRef(false);
  const current = steps[step];
  const last = step === steps.length - 1;

  useEffect(() => {
    // Opening counts as seen, so closing the app halfway through does not trap
    // someone in the tour on the next launch. Account always offers a replay.
    markSeen();
  }, [markSeen]);

  function goTo(next: number) {
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
    AccessibilityInfo.announceForAccessibility(
      `Step ${next + 1} of ${steps.length}. ${steps[next].title}`,
    );
  }

  function finish() {
    if (closing.current) return;
    closing.current = true;
    markSeen();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.frame}>
        <View style={styles.header}>
          <Brand />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip app tour"
            onPress={finish}
            style={styles.skip}
          >
            <Text style={styles.skipText}>Skip tour</Text>
          </Pressable>
        </View>
        <View style={styles.progressArea}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>APP TOUR · SIX SHORT STEPS</Text>
            <Text style={styles.stepCount}>
              {step + 1} / {steps.length}
            </Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="App tour progress"
            accessibilityValue={{ min: 1, max: steps.length, now: step + 1 }}
            style={styles.progress}
          >
            {steps.map((item, index) => (
              <View
                key={item.area}
                style={[
                  styles.progressPart,
                  index <= step && styles.progressComplete,
                ]}
              />
            ))}
          </View>
        </View>
        <ScrollView
          ref={scroll}
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <View key={current.area} style={styles.step}>
            <Text style={styles.eyebrow}>{current.area}</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {current.title}
            </Text>
            <Text style={styles.body}>{current.body}</Text>
            <View style={styles.demo}>
              <Text style={styles.demoLabel}>
                {step < 3 ? 'TRY AN EXAMPLE' : 'A QUICK LOOK'}
              </Text>
              {step === 0 ? <DiscoverExample /> : null}
              {step === 1 ? <FeedExample /> : null}
              {step === 2 ? <AlertExample /> : null}
              {step === 3 ? <CommunityExample /> : null}
              {step === 4 ? <PostExample /> : null}
              {step === 5 ? <AccountExample /> : null}
              <Text style={styles.exampleNote}>
                Examples only — nothing here changes your account.
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipLabel}>GOOD TO KNOW</Text>
              <Text style={styles.tipText}>{current.tip}</Text>
            </View>
            {last ? (
              <Text style={styles.body}>
                Ready to explore? Browse first, or sign in or create an account
                from Account whenever you want to take part.
              </Text>
            ) : null}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <View style={styles.navigation}>
            {step > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => goTo(step - 1)}
                style={styles.back}
              >
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => (last ? finish() : goTo(step + 1))}
              style={styles.next}
            >
              <Text style={styles.nextText}>
                {last ? 'Let’s explore' : 'Next'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.replay}>
            Replay anytime in Account → App tour
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const feeds = ['Earn money', 'Freebies', 'Deals'] as const;
const feedExamples = [
  {
    category: 'Survey panels',
    title: 'Find a survey panel that suits you',
    detail: 'Compare rewards, eligibility and time needed.',
  },
  {
    category: 'Samples',
    title: 'Discover something to try for free',
    detail: 'Check availability, delivery and any conditions.',
  },
  {
    category: 'Tech & gaming',
    title: 'Spot a saving on your next purchase',
    detail: 'Check the price and any voucher code before buying.',
  },
] as const;

function DiscoverExample() {
  const [selected, setSelected] = useState(0);
  const example = feedExamples[selected];
  return (
    <View style={styles.exampleContent}>
      <View style={styles.segments}>
        {feeds.map((label, index) => (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: selected === index }}
            onPress={() => setSelected(index)}
            style={[
              styles.segment,
              selected === index && styles.selectedSegment,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                selected === index && styles.selectedText,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.exampleCard} accessibilityLiveRegion="polite">
        <Text style={styles.category}>{example.category}</Text>
        <Text style={styles.cardTitle}>{example.title}</Text>
        <Text style={styles.smallText}>{example.detail}</Text>
      </View>
      <Text style={styles.smallText}>Try tapping a different feed above.</Text>
    </View>
  );
}

function FeedExample() {
  const [vote, setVote] = useState(0);
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);
  return (
    <View style={styles.exampleContent}>
      {hidden ? (
        <View style={styles.exampleCard}>
          <Text accessibilityLiveRegion="polite" style={styles.cardTitle}>
            This practice post is hidden.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setHidden(false)}
            style={styles.outlineButton}
          >
            <Text style={styles.linkText}>Unhide example</Text>
          </Pressable>
        </View>
      ) : (
        <Swipeable
          overshootRight={false}
          rightThreshold={56}
          onSwipeableOpen={() => setHidden(true)}
          renderRightActions={() => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hide practice post"
              onPress={() => setHidden(true)}
              style={styles.hideAction}
            >
              <Text style={styles.nextText}>Hide</Text>
            </Pressable>
          )}
        >
          <View style={styles.practiceCard}>
            <View style={styles.voteColumn}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Try voting hotter"
                accessibilityState={{ selected: vote === 1 }}
                onPress={() => setVote(vote === 1 ? 0 : 1)}
                style={[styles.voteButton, vote === 1 && styles.voteSelected]}
              >
                <Text style={styles.arrow}>⌃</Text>
              </Pressable>
              <Text
                accessibilityLiveRegion="polite"
                accessibilityLabel={`Example temperature ${24 + vote} degrees`}
                style={styles.temperature}
              >
                {24 + vote}°
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Try voting colder"
                accessibilityState={{ selected: vote === -1 }}
                onPress={() => setVote(vote === -1 ? 0 : -1)}
                style={[styles.voteButton, vote === -1 && styles.voteSelected]}
              >
                <Text style={styles.arrow}>⌄</Text>
              </Pressable>
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.category}>PRACTICE POST</Text>
              <Text style={styles.cardTitle}>A find worth keeping</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? 'Unsave practice post' : 'Try saving a post'
                }
                accessibilityState={{ selected: saved }}
                onPress={() => setSaved(!saved)}
                style={[styles.outlineButton, saved && styles.savedButton]}
              >
                <Text style={styles.linkText}>
                  {saved ? 'Saved ✓' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Swipeable>
      )}
      <Text style={styles.smallText}>
        {hidden
          ? 'Unhide brings the post back into your feed.'
          : 'Try the arrows and Save. Then swipe the card left.'}
      </Text>
      {!hidden ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setHidden(true)}
          style={styles.textButton}
        >
          <Text style={styles.linkText}>Or tap to try hiding it</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AlertExample() {
  const [category, setCategory] = useState(false);
  return (
    <View style={styles.exampleContent}>
      <View style={styles.segments}>
        {[
          [false, 'A keyword'],
          [true, 'A whole category'],
        ].map(([value, label]) => (
          <Pressable
            key={String(label)}
            accessibilityRole="tab"
            accessibilityState={{ selected: category === value }}
            onPress={() => setCategory(Boolean(value))}
            style={[
              styles.segment,
              category === value && styles.selectedSegment,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                category === value && styles.selectedText,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.exampleCard} accessibilityLiveRegion="polite">
        <Text style={styles.category}>
          {category ? 'CATEGORY: SURVEY PANELS' : 'KEYWORD: SURVEY'}
        </Text>
        <Text style={styles.cardTitle}>
          {category
            ? 'Every new post in Survey panels'
            : 'New posts matching “survey”'}
        </Text>
        <Text style={styles.smallText}>
          {category
            ? 'Leave the keyword blank to cover the whole category.'
            : 'Common singular and plural forms match too, such as survey and surveys.'}
        </Text>
      </View>
      <Text style={styles.smallText}>
        You can also get push notifications for replies, mentions and private
        messages.
      </Text>
    </View>
  );
}

function CommunityExample() {
  const [profile, setProfile] = useState(false);
  return (
    <View style={styles.exampleContent}>
      <View style={styles.exampleCard}>
        <Text style={styles.category}>EXAMPLE DISCUSSION</Text>
        <Text style={styles.cardTitle}>
          Which survey panels do you enjoy using?
        </Text>
        <Text style={styles.smallText}>
          Replies appear directly below the post. Choose Newest or Oldest to
          change their order.
        </Text>
        <View style={styles.reply}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try opening an example member profile"
            onPress={() => setProfile(!profile)}
            style={styles.textButton}
          >
            <Text style={styles.linkText}>@example_member</Text>
          </Pressable>
          <Text style={styles.smallText}>
            I look for ones that explain the time and reward clearly.
          </Text>
        </View>
      </View>
      {profile ? (
        <View style={styles.profilePreview} accessibilityLiveRegion="polite">
          <Text style={styles.cardTitle}>Member profile → Message</Text>
          <Text style={styles.smallText}>
            This is where you can start a private conversation. An existing chat
            with that member opens again.
          </Text>
        </View>
      ) : (
        <Text style={styles.smallText}>
          Try tapping the example member’s name.
        </Text>
      )}
    </View>
  );
}

function PostExample() {
  return (
    <View style={styles.exampleContent}>
      <View style={styles.postTypes}>
        {['Earn', 'Freebie', 'Deal', 'Discussion'].map((label) => (
          <View key={label} style={styles.typePill}>
            <Text style={styles.segmentText}>{label}</Text>
          </View>
        ))}
      </View>
      <Feature
        number="1"
        title="Explain the find"
        body="Who is it for, what do they get, and what do they need to do?"
      />
      <Feature
        number="2"
        title="Include the important conditions"
        body="Mention any cost, expiry or eligibility requirements."
      />
      <Feature
        number="3"
        title="Submit your opportunity"
        body="A moderator checks it, then you get an alert about the decision."
      />
    </View>
  );
}

function AccountExample() {
  return (
    <View style={styles.exampleContent}>
      <View style={styles.tracker}>
        <Text style={styles.category}>EXAMPLE EARNINGS RECORD</Text>
        <Text style={styles.trackerTotal}>£45.00</Text>
        <View style={styles.bar}>
          <View style={styles.barFill} />
        </View>
        <Text style={styles.smallText}>
          Your entries become totals and charts. Filter by date to see how
          you’re doing.
        </Text>
      </View>
      <Feature
        number="✓"
        title="Saved opportunities"
        body="Return to the finds you want to try."
      />
      <Feature
        number="↔"
        title="One account, app and website"
        body="Your community activity stays together."
      />
    </View>
  );
}

function Feature({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureNumber}>
        <Text style={styles.featureNumberText}>{number}</Text>
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.smallText}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.canvas },
  frame: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  skip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  skipText: { color: colours.slate, fontSize: 14, fontWeight: '700' },
  progressArea: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressText: {
    flex: 1,
    color: colours.slate,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepCount: { color: colours.slate, fontSize: 12, fontWeight: '700' },
  progress: { flexDirection: 'row', gap: 5 },
  progressPart: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colours.line,
  },
  progressComplete: { backgroundColor: colours.green },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  step: { gap: spacing.lg },
  eyebrow: {
    color: colours.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    color: colours.ink,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  body: { color: colours.slate, fontSize: 15, lineHeight: 23 },
  demo: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
    gap: spacing.md,
  },
  demoLabel: {
    color: colours.slate,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  exampleContent: { gap: spacing.md },
  exampleNote: { color: colours.slate, fontSize: 11, lineHeight: 16 },
  segments: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  segment: {
    flex: 1,
    minWidth: 70,
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: '#E8EEF4',
  },
  selectedSegment: { backgroundColor: colours.navy },
  segmentText: {
    color: colours.navy,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  selectedText: { color: colours.surface },
  exampleCard: {
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colours.surface,
  },
  category: {
    color: colours.green,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
  },
  cardTitle: {
    color: colours.ink,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
  },
  smallText: { color: colours.slate, fontSize: 13, lineHeight: 20 },
  tip: {
    paddingLeft: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colours.mint,
    gap: 6,
  },
  tipLabel: {
    color: colours.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tipText: { color: colours.ink, fontSize: 14, lineHeight: 22 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colours.line,
    backgroundColor: colours.canvas,
  },
  navigation: { flexDirection: 'row', gap: spacing.md },
  next: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.navy,
  },
  nextText: { color: colours.surface, fontSize: 16, fontWeight: '700' },
  back: {
    minWidth: 78,
    minHeight: 50,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: radius.md,
    backgroundColor: colours.surface,
  },
  backText: { color: colours.ink, fontSize: 15, fontWeight: '700' },
  replay: {
    color: colours.slate,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
  practiceCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colours.surface,
  },
  voteColumn: { alignItems: 'center', gap: 4 },
  voteButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colours.line,
  },
  voteSelected: {
    borderColor: colours.coral,
    backgroundColor: colours.coralPale,
  },
  arrow: { color: colours.coral, fontSize: 26, fontWeight: '800' },
  temperature: { color: colours.coral, fontSize: 20, fontWeight: '800' },
  cardCopy: { flex: 1, minWidth: 0, gap: 5, justifyContent: 'center' },
  outlineButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    minWidth: 88,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  savedButton: {
    borderColor: colours.green,
    backgroundColor: colours.mintPale,
  },
  linkText: { color: colours.green, fontSize: 13, fontWeight: '700' },
  textButton: { minHeight: 44, justifyContent: 'center' },
  hideAction: {
    width: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colours.navy,
  },
  reply: {
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colours.line,
    marginTop: spacing.sm,
    gap: 2,
  },
  profilePreview: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colours.mintPale,
    gap: 6,
  },
  postTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: '#E8EEF4',
  },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  featureNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colours.mintPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureNumberText: { color: colours.green, fontSize: 14, fontWeight: '800' },
  featureTitle: {
    color: colours.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  tracker: {
    padding: spacing.md,
    backgroundColor: colours.canvas,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  trackerTotal: { color: colours.ink, fontSize: 30, fontWeight: '800' },
  bar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colours.line,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    width: '65%',
    borderRadius: 4,
    backgroundColor: colours.green,
  },
});
