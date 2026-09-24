import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getFeed,
  mutate,
  saveToken,
  signIn as apiSignIn,
  signOut as apiSignOut,
  token,
} from "@/lib/api";
import type { Feed } from "@/lib/types";

type AppContextValue = {
  feed: Feed | null;
  loading: boolean;
  error: string;
  signedIn: boolean;
  refresh: () => Promise<void>;
  action: <T = { ok: true }>(body: Record<string, unknown>) => Promise<T>;
  signIn: (login: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export function AppProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sessionEpoch = useRef(0);
  const signOutPending = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    const epoch = sessionEpoch.current;
    try {
      if (signOutPending.current) await signOutPending.current;
      const next = await getFeed();
      if (epoch !== sessionEpoch.current) return;
      setFeed(next);
      setError("");
    } catch (problem) {
      if (epoch !== sessionEpoch.current) return;
      setError(
        problem instanceof Error
          ? problem.message
          : "Unable to load Ways2Earn.",
      );
    } finally {
      if (epoch === sessionEpoch.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const response = Notifications.addNotificationResponseReceivedListener(
      (event) => {
        const href = event.notification.request.content.data?.href;
        if (typeof href === "string") router.push(href as never);
      },
    );
    return () => response.remove();
  }, [refresh, router]);

  const action = useCallback(
    async <T,>(body: Record<string, unknown>) => {
      const result = await mutate<T>(body);
      await refresh();
      return result;
    },
    [refresh],
  );

  const signIn = useCallback(
    async (login: string, password: string) => {
      if (signOutPending.current) await signOutPending.current;
      await apiSignIn(login, password);
      sessionEpoch.current += 1;
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    // Invalidate in-flight feed requests before clearing the visible account.
    sessionEpoch.current += 1;
    setFeed((current) =>
      current
        ? {
            ...current,
            user: null,
            unread: 0,
            unreadMessages: 0,
            pushEnabled: false,
          }
        : null,
    );
    setError("");
    setLoading(false);
    const pending = (async () => {
      const bearer = await token();
      await saveToken(null);
      void apiSignOut(bearer).catch(() => undefined);
    })();
    signOutPending.current = pending;
    try {
      await pending;
    } finally {
      if (signOutPending.current === pending) signOutPending.current = null;
    }
  }, []);

  const value = useMemo(
    () => ({
      feed,
      loading,
      error,
      signedIn: Boolean(feed?.user),
      refresh,
      action,
      signIn,
      signOut,
    }),
    [action, error, feed, loading, refresh, signIn, signOut],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider.");
  return value;
}
