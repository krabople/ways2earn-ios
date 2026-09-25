import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { linkAppleAccount, request, socialProviders } from "@/lib/api";
import { colours, radius, spacing } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

export default function AccountScreen() {
  const { feed, signedIn, signOut, action, refresh } = useApp();
  const [notifications, setNotifications] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleLinked, setAppleLinked] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  useEffect(() => {
    if (!signedIn) return;
    void Promise.all([socialProviders(), request<{ linkedProviders: string[] }>("?view=my")])
      .then(([providers, account]) => { setAppleAvailable(providers.includes("apple")); setAppleLinked(account.linkedProviders?.includes("apple") ?? false); })
      .catch(() => undefined);
  }, [signedIn]);
  useEffect(
    () => setNotifications(Boolean(feed?.pushEnabled)),
    [feed?.pushEnabled],
  );
  if (!signedIn || !feed?.user)
    return (
      <Screen title="Account">
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Make Ways2Earn yours.</Text>
          <Text style={styles.help}>
            Save opportunities, track progress, join discussions and receive
            alerts when something relevant appears.
          </Text>
          <Pressable
            style={styles.primary}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/register")}>
            <Text style={styles.guestLink}>Create an account</Text>
          </Pressable>
        </View>
        <LegalLinks />
      </Screen>
    );

  async function toggleNotifications(enabled: boolean) {
    if (!enabled) {
      setNotifications(false);
      await action({ action: "registerPush", token: "", enabled: false });
      return;
    }
    if (!Device.isDevice) {
      Alert.alert(
        "Physical device required",
        "Push notifications can be tested on a real iPhone or iPad.",
      );
      return;
    }
    const permission = await Notifications.requestPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Notifications are off",
        "You can enable them later in iOS Settings.",
      );
      return;
    }
    const push = await Notifications.getDevicePushTokenAsync();
    const nativeToken =
      typeof push.data === "string" ? push.data : JSON.stringify(push.data);
    await action({
      action: "registerPush",
      token: nativeToken,
      enabled: true,
      platform: "ios",
      provider: "apns",
    });
    setNotifications(true);
  }

  return (
    <Screen title="Account">
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {feed.user.displayName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{feed.user.displayName}</Text>
          <Text style={styles.handle}>@{feed.user.handle}</Text>
        </View>
      </View>
      {feed.user.role !== "member" ? (
        <View style={styles.admin}>
          <Text style={styles.adminKicker}>MODERATION</Text>
          <Text style={styles.adminTitle}>Community controls</Text>
          <Text style={styles.help}>
            Review pending posts, reports and hidden content from the app.
          </Text>
          <Pressable
            style={styles.adminButton}
            onPress={() => router.push("/moderation" as never)}
          >
            <Text style={styles.adminButtonText}>Open moderation panel</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.group}>
        <Row
          title="Saved opportunities"
          subtitle="Your shortlist and progress"
          onPress={() => router.push("/saved")}
        />
        <Row
          title="Messages"
          subtitle={
            feed.unreadMessages
              ? `${feed.unreadMessages} unread`
              : "Member and moderator conversations"
          }
          onPress={() => router.push("/messages" as never)}
        />
        <Row
          title="Earnings tracker"
          subtitle="Charts, totals and your private records"
          onPress={() => router.push("/earnings" as never)}
        />
      </View>
      <View style={styles.group}>
        <View style={styles.switchRow}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Push notifications</Text>
            <Text style={styles.help}>
              Replies, mentions, messages and alert matches. Never required.
            </Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={(value) => void toggleNotifications(value)}
            trackColor={{ true: colours.mint }}
          />
        </View>
        <Row
          title="Notification preferences"
          subtitle="Choose exactly what can interrupt you"
          onPress={() => router.push("/notification-settings" as never)}
        />
      </View>
      {appleAvailable ? <View style={styles.group}>
        <Row title="Apple sign-in" subtitle={appleLinked ? "Connected to this account" : "Use your Apple Account to sign in next time"} onPress={() => {
          if (appleLinked || linkBusy) return;
          setLinkBusy(true);
          void linkAppleAccount().then(async user => { if (user) { setAppleLinked(true); await refresh(); } }).catch(problem => Alert.alert("Could not connect Apple", problem instanceof Error ? problem.message : "Please try again.")).finally(() => setLinkBusy(false));
        }} />
      </View> : null}
      <LegalLinks />
      <Pressable
        style={styles.signOut}
        onPress={() => {
          void signOut();
        }}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/close-account" as never)}>
        <Text style={styles.close}>Close my account</Text>
      </Pressable>
    </Screen>
  );
}

function Row({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.help}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}
function LegalLinks() {
  return (
    <View style={styles.legal}>
      <Pressable onPress={() => router.push("/privacy" as never)}>
        <Text style={styles.link}>Privacy policy</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/trust" as never)}>
        <Text style={styles.link}>Trust centre & community rules</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/support" as never)}>
        <Text style={styles.link}>Contact support</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colours.navy,
    gap: spacing.md,
  },
  heroTitle: { color: "white", fontSize: 25, fontWeight: "900" },
  help: { color: colours.slate, fontSize: 12, lineHeight: 18 },
  primary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colours.mint,
  },
  primaryText: { color: colours.navy, fontWeight: "900" },
  guestLink: { color: "white", textAlign: "center", fontWeight: "800" },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colours.mintPale,
  },
  avatarText: { color: colours.green, fontSize: 18, fontWeight: "900" },
  name: { color: colours.ink, fontSize: 20, fontWeight: "800" },
  handle: { color: colours.slate, marginTop: 3 },
  admin: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colours.navy,
    gap: spacing.sm,
  },
  adminKicker: {
    color: colours.mint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  adminTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  adminButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colours.mint,
  },
  adminButtonText: { color: colours.navy, fontWeight: "900" },
  group: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  row: {
    minHeight: 65,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colours.line,
  },
  switchRow: {
    minHeight: 80,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colours.line,
  },
  rowCopy: { flex: 1, gap: 3, justifyContent: "center" },
  rowTitle: { color: colours.ink, fontSize: 14, fontWeight: "800" },
  chevron: { color: colours.slate, fontSize: 26 },
  legal: { gap: spacing.md, padding: spacing.lg },
  link: { color: colours.green, fontSize: 13, fontWeight: "700" },
  signOut: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  signOutText: { color: colours.ink, fontWeight: "800" },
  close: {
    color: colours.slate,
    fontSize: 12,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
