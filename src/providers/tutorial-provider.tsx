import { router, usePathname, useRootNavigationState } from 'expo-router';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { readTutorialSeen, writeTutorialSeen } from '@/lib/tutorial-storage';

const TutorialContext = createContext<{
  seen: boolean | null;
  markSeen: () => void;
} | null>(null);

export function TutorialProvider({ children }: PropsWithChildren) {
  const [seen, setSeen] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    void readTutorialSeen()
      .then((stored) => {
        if (mounted) setSeen((current) => current === true || stored);
      })
      .catch(() => {
        // A preference error must never prevent access to the app.
        if (mounted) setSeen(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const markSeen = useCallback(() => {
    setSeen(true);
    void writeTutorialSeen().catch(() => {
      // Dismissal still works if the device cannot save the preference.
    });
  }, []);
  const value = useMemo(() => ({ seen, markSeen }), [seen, markSeen]);
  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context)
    throw new Error('useTutorial must be used inside TutorialProvider.');
  return context;
}

export function TutorialLauncher() {
  const { seen } = useTutorial();
  const pathname = usePathname();
  const navigation = useRootNavigationState();
  const opened = useRef(false);

  useEffect(() => {
    // Wait for the navigator and the main feed. Deep links, login callbacks and
    // notification destinations retain their original route and are not covered.
    if (
      seen !== false ||
      !navigation?.key ||
      pathname !== '/' ||
      opened.current
    )
      return;
    opened.current = true;
    router.push('/tutorial');
  }, [seen, pathname, navigation?.key]);
  return null;
}
