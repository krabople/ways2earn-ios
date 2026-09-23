import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Ways2Earn',
  slug: 'ways2earn-ios',
  extra: {
    ...config.extra,
    eas: process.env.EXPO_PROJECT_ID ? { projectId: process.env.EXPO_PROJECT_ID } : undefined,
  },
});
