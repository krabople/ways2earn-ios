import { ArticleDoneButton, ArticleIntro, ArticleSection, Bullet, Paragraph } from '@/components/article';
import { Screen } from '@/components/screen';

export default function PrivacyScreen() {
  return <Screen title="Privacy policy" action={<ArticleDoneButton />}>
    <ArticleIntro kicker="YOUR INFORMATION" title="Privacy without surprises.">This is the in-app summary of how Ways2Earn uses information. It applies alongside the full policy shown on the website.</ArticleIntro>
    <ArticleSection title="Accounts and public activity">
      <Paragraph>Your profile, published posts, discussions and comments can be seen by other people. Saved opportunities, earnings records, support requests and notification choices are private to your account.</Paragraph>
      <Paragraph>Private messages are normally visible only to their participants. If a conversation is reported, the reporter can choose to attach a recent transcript for the moderation team.</Paragraph>
    </ArticleSection>
    <ArticleSection title="What the app stores" tone="green">
      <Bullet>Your sign-in token is kept in secure device storage so you can remain signed in.</Bullet>
      <Bullet>If you opt into push notifications, the device push token is linked to your account. You can turn this off from Account.</Bullet>
      <Bullet>Ways2Earn does not use the app for advertising tracking and does not use Google Analytics in the app.</Bullet>
    </ArticleSection>
    <ArticleSection title="Images, support and moderation">
      <Paragraph>Images you upload are resized and re-encoded before storage. Support messages can be read by the moderation team. Limited security records and rate limits help prevent abuse.</Paragraph>
      <Paragraph>Do not post passwords, one-time codes, bank details or identity documents. Remove personal information from screenshots before uploading them.</Paragraph>
    </ArticleSection>
    <ArticleSection title="Your choices" tone="navy">
      <Paragraph light>You can sign out, disable push notifications or close your account from the Account tab. To request access, correction or deletion, contact the team through the in-app support screen.</Paragraph>
    </ArticleSection>
  </Screen>;
}
