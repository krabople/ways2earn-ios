import { ArticleDoneButton, ArticleIntro, ArticleSection, Bullet, Paragraph } from '@/components/article';
import { Screen } from '@/components/screen';

export default function TrustScreen() {
  return <Screen title="Trust centre" action={<ArticleDoneButton />}>
    <ArticleIntro kicker="CHECK BEFORE YOU ACT" title="Make better-informed choices.">Ways2Earn helps members compare real experiences. Moderation and community votes are useful context, not a guarantee that an offer is safe or suitable.</ArticleIntro>
    <ArticleSection title="A five-minute opportunity check" tone="green">
      <Bullet>Open the provider’s official website and check the full domain, terms, eligibility and closing date.</Bullet>
      <Bullet>Write down the reward, required spending, fees, steps and expected payment date.</Bullet>
      <Bullet>Save a dated copy of the terms and confirmation. Treat cashback and bonuses as possible extras until paid.</Bullet>
      <Bullet>Read recent failures as well as successes. Ask publicly if an important detail is missing.</Bullet>
    </ArticleSection>
    <ArticleSection title="Warning signs">
      <Bullet>Never share banking passwords, one-time security codes or remote access to your device.</Bullet>
      <Bullet>Stop if someone asks for an upfront fee to release work, a reward or recovered money.</Bullet>
      <Bullet>Be cautious with guaranteed returns, pressure, secrecy and requests to receive and forward money.</Bullet>
      <Bullet>Verify an organisation using contact details you found independently.</Bullet>
    </ArticleSection>
    <ArticleSection title="What our checks do - and don’t do">
      <Paragraph>New opportunities and member edits go through moderation. Automated checks can hold obvious referral parameters, shortened links and possible personal codes for review.</Paragraph>
      <Paragraph>A flag is a reason for a human to investigate, not proof of wrongdoing. Approval means a post is allowed on Ways2Earn; it is not independent verification of a provider, payment or investment.</Paragraph>
    </ArticleSection>
    <ArticleSection title="Community rules" tone="navy">
      <Bullet light>No member affiliate or referral links or codes in posts, comments, profiles or unsolicited messages.</Bullet>
      <Bullet light>Use the direct provider link, give complete terms and disclose any connection.</Bullet>
      <Bullet light>No misleading income claims, recruitment chains, spam, vote manipulation or harassment.</Bullet>
      <Bullet light>Respect privacy. Never request identity documents, passwords or security codes from another member.</Bullet>
      <Bullet light>Only upload images you have permission to use. Report problems rather than retaliating.</Bullet>
    </ArticleSection>
    <ArticleSection title="Affiliate disclosure">
      <Paragraph>Administrators may add clearly disclosed affiliate links that support Ways2Earn. A commission does not guarantee that an offer is suitable or that a reward will pay. Always compare the provider’s current terms yourself.</Paragraph>
    </ArticleSection>
  </Screen>;
}
