# Ways2Earn App Store readiness

This is an implementation checklist, not legal advice. Re-check the live App Review Guidelines before every submission.

## Product position

Ways2Earn is a community utility for discovering, checking and tracking earning opportunities, freebies and deals. It is not positioned as a catalogue of affiliate links. Native utility includes voting haptics, saved and progress states, earnings tracking, member messaging, personalised alerts, push notifications, native sharing and an in-app source browser.

## Review safeguards already designed in

- Browsing remains available without an account after public launch. Sign-in is requested only for account features.
- Affiliate relationships are disclosed beside the affected opportunity before the source button.
- External sources open in an iOS browser sheet and never imitate an Apple purchase flow.
- User posts are moderated before publication; obvious referral links are held automatically.
- Users can report posts and comments, block members, and contact support.
- Push permission is requested only after the user deliberately enables it in Account. Push is optional and can be disabled in-app.
- Private message content is never placed in push notification text.
- Account deletion is available in Account but requires the password, an exact confirmation phrase and a final destructive confirmation.
- Privacy policy, Trust Centre, community rules and support are available from Account.

## Before TestFlight/App Review

- [ ] Enrol in the Apple Developer Program and create the App Store Connect record.
- [ ] Create/link the EAS project and add `EXPO_TOKEN` and `EXPO_PROJECT_ID` as GitHub repository secrets.
- [ ] Complete Apple signing once interactively so EAS can use managed credentials non-interactively.
- [ ] Add a dedicated App Review demo account with populated but non-sensitive data.
- [ ] Disable the public holding gate or explicitly allow the review account through it.
- [ ] Complete App Privacy answers for account details, user content, identifiers, diagnostics and any analytics actually present in the submitted build.
- [ ] Confirm privacy policy language covers mobile sessions, device push tokens and Expo's push delivery service.
- [ ] Give App Review precise notes explaining moderation, affiliate disclosure, external physical/off-app offers and where report/block/delete controls are located.
- [ ] Test report response procedures and publish a support contact address.
- [ ] Supply representative in-app screenshots, not marketing-only artwork.
- [ ] Do not add third-party advertising or cross-app tracking without a separate privacy/ATT review.
