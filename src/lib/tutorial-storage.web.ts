const key = 'ways2earn.app-tour.seen';

export async function readTutorialSeen(): Promise<boolean> {
  return globalThis.localStorage.getItem(key) === 'seen';
}

export async function writeTutorialSeen(): Promise<void> {
  globalThis.localStorage.setItem(key, 'seen');
}
