# Ways2Earn for iOS

A native Expo/React Native client for the Ways2Earn community. It shares the live Ways2Earn database through a purpose-built bearer-token API; it is not a web wrapper.

## Native product areas

- Six-step first-use app tour with practice feed controls, Skip/Back, and replay from Account → App tour (also available to guests)
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

The GitHub Actions workflow uses a macOS runner and Xcode directly. It does not require an Expo account. It requires:

- an App Store Connect API key stored as `ASC_KEY_ID`, `ASC_ISSUER_ID` and base64-encoded `ASC_API_KEY_BASE64` repository secrets;
- the Apple Developer team identifier stored as `APPLE_TEAM_ID`;
- an App Store Connect record and App ID for bundle ID `com.krabople.ways2earn`.

After those one-time owner-authenticated steps, run **Build and upload iOS to TestFlight** from GitHub Actions. It generates the native Xcode project, signs and attaches `Ways2Earn.ipa`, then uploads the same build to TestFlight. It does not submit the app for public App Review.

See [APP-STORE-READINESS.md](APP-STORE-READINESS.md) before TestFlight or App Review.

## App tour checks

The tour opens once when a new installation first reaches Discover. Existing installations without the tour preference see it once after this update. It waits until the main feed is reached when launched through a deep link, notification or login callback. Seeing it is remembered locally, including when skipped, closed with system Back, or interrupted by closing the app. Signing out does not reset it. It can always be replayed from Account, including before signing in.

For device QA, check fresh-launch and relaunch behavior, Skip on an intermediate step, completion, replay returning to Account, and a deep link before the first visit to Discover. Practice controls must never change real votes, saved posts, hidden posts or alerts. Check swipe-to-hide and Unhide on the sample card, the iPhone SE layout, VoiceOver, and larger text sizes; content should scroll while Skip/Back/Next remain available. The tour works offline and does not request notification permissions.
