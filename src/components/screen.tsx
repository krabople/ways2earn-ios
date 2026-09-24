import type { PropsWithChildren, ReactNode } from "react";
import { router } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colours, spacing } from "@/lib/theme";

export function Brand() {
  return (
    <Text accessibilityRole="header" style={styles.brand}>
      ways<Text style={styles.two}>2</Text>earn
    </Text>
  );
}

export function BackAction({
  fallback = "/(tabs)/account",
}: {
  fallback?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
      onPress={() =>
        router.canGoBack() ? router.back() : router.replace(fallback as never)
      }
      style={styles.backButton}
    >
      <Text style={styles.backIcon}>‹</Text>
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  );
}

export function Screen({
  children,
  title,
  action,
  back,
  refreshing,
  onRefresh,
}: PropsWithChildren<{
  title?: string;
  action?: ReactNode;
  back?: boolean | string;
  refreshing?: boolean;
  onRefresh?: () => void;
}>) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.heading}>
          {back ? (
            <BackAction
              fallback={typeof back === "string" ? back : "/(tabs)/account"}
            />
          ) : null}
          {title ? (
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
          ) : (
            <Brand />
          )}
        </View>
        {action}
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={colours.green}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.canvas },
  header: {
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colours.surface,
    borderBottomColor: colours.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  heading: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  backButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingRight: spacing.sm,
  },
  backIcon: { color: colours.green, fontSize: 30, lineHeight: 30 },
  backText: { color: colours.green, fontSize: 14, fontWeight: "800" },
  brand: {
    color: colours.navy,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -1.1,
  },
  two: { color: colours.mint },
  title: {
    color: colours.ink,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  content: { padding: spacing.lg, paddingBottom: 110, gap: spacing.lg },
});
