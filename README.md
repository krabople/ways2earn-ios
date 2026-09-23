# Ways2Earn for iOS

A native Expo/React Native client for the Ways2Earn community. It shares the live Ways2Earn database through a purpose-built bearer-token API; it is not a web wrapper.

## Native product areas

- Earn, freebie and deal discovery with search, categories, weighted voting and saved posts
- Opportunity detail, trust information, outcomes, progress, comments, reactions, reporting and native sharing
- Community discussions and replies
- Member messages, alerts and email-alert preferences
- Private earnings tracker
- Type-aware opportunity submission with linked or uploaded images
- Optional push notifications with deep links
- In-app account closure with password and exact-phrase safeguards
- Affiliate disclosure before opening an external source in an iOS browser sheet

## Local checks

```bash
npm ci
npm run lint
npx tsc --noEmit
npx expo-doctor
```

`EXPO_PUBLIC_API_ORIGIN` defaults to `https://www.ways2earn.com`.

## Signed iOS builds

The GitHub Actions workflow uses EAS Build. It requires:

- an Expo/EAS project linked in `app.config.ts`;
- repository secrets `EXPO_TOKEN`, `EXPO_PROJECT_ID` and the numeric `ASC_APP_ID`;
- Apple distribution credentials configured for bundle ID `com.krabople.ways2earn`.

After those one-time owner-authenticated steps, run **Build signed iOS IPA** from GitHub Actions. The workflow waits for the signed build, attaches `Ways2Earn.ipa` as a private workflow artifact and uploads the same build to TestFlight. It does not submit the app for public App Review.

See [APP-STORE-READINESS.md](APP-STORE-READINESS.md) before TestFlight or App Review.
