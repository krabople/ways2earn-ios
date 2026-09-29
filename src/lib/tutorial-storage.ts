import { File, Paths } from 'expo-file-system';

// Documents survives app updates. This preference is local to the installation,
// independent of signing in, signing out or switching accounts.
const preferenceFile = () => new File(Paths.document, 'ways2earn-app-tour.txt');

export async function readTutorialSeen(): Promise<boolean> {
  const file = preferenceFile();
  return file.exists && (await file.text()) === 'seen';
}

export async function writeTutorialSeen(): Promise<void> {
  preferenceFile().write('seen');
}
