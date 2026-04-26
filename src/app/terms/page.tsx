// Imprint terms of service. Public, no auth.
// Wording uses commas, parentheses, or single dashes only. No em dashes.

export const metadata = {
  title: 'Terms of service, Imprint',
  description: 'How Imprint and its users (artists, fans, managers) work together.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-warm-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-4xl mb-2 text-warm-white" style={{ fontFamily: 'Canela, serif', fontWeight: 300 }}>
          Terms of service
        </h1>
        <p className="text-vault-muted mb-12 text-sm">Last updated: 2026-04-26</p>

        <Section title="What this is">
          <p>
            Imprint is a fan identity and verification protocol. Artists own their fan relationships. Fans own their listening identity. These terms govern what you can and cannot do as a user of either side.
          </p>
        </Section>

        <Section title="Accounts">
          <ul className="list-disc pl-6 space-y-2">
            <li>You must be 13 or older (16 in the EU). Children under those ages cannot sign up.</li>
            <li>You are responsible for keeping your password and OAuth tokens private.</li>
            <li>You can have one artist account, one fan account, and one manager account per email. Manager mode is opt-in via settings.</li>
            <li>We can suspend an account that violates these terms (see "Acceptable use") with notice except in emergencies.</li>
          </ul>
        </Section>

        <Section title="What artists agree to">
          <ul className="list-disc pl-6 space-y-2">
            <li>You will not import contact lists you do not have consent to message.</li>
            <li>You will not send drops to fans who have unsubscribed.</li>
            <li>You will not gate content behind verification tokens for activity that violates platform rules (spam, fraud, harassment).</li>
            <li>You can delete your account at any time. Fan records you created are erased with the account, except where a fan has independently registered, in which case the fan's identity persists with their consent.</li>
          </ul>
        </Section>

        <Section title="What fans agree to">
          <ul className="list-disc pl-6 space-y-2">
            <li>The OAuth connections you authorize (Spotify, YouTube, Discord) grant Imprint a read-only view of the data you opted into. You can disconnect at any time in settings.</li>
            <li>Verification tokens you receive (sigils, fan-status proofs) are tied to your identity. Selling or transferring them is not permitted.</li>
            <li>Your data is portable. You can export, edit, or delete your fan record at any time.</li>
          </ul>
        </Section>

        <Section title="What managers agree to">
          <ul className="list-disc pl-6 space-y-2">
            <li>Roster Intel (the manager dashboard) is a read-only view of artist data. You cannot impersonate the artist, send drops on their behalf without explicit consent, or modify their settings.</li>
            <li>Artists can revoke your access at any time. You will lose visibility immediately.</li>
            <li>Aggregating roster data outside Imprint (exporting, sharing with third parties) requires the artist's written consent for each artist.</li>
          </ul>
        </Section>

        <Section title="Acceptable use">
          <p>You will not use Imprint to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Send unsolicited messages or spam.</li>
            <li>Impersonate another person or artist.</li>
            <li>Inflate fan counts using bots, automation, or fake accounts.</li>
            <li>Resell or sublicense Imprint's verification tokens.</li>
            <li>Reverse-engineer the platform, its APIs, or its protocol with intent to circumvent.</li>
            <li>Violate the rules of any platform Imprint integrates with (Spotify, Apple Music, Discord, etc.).</li>
            <li>Harass, threaten, or harm any user.</li>
          </ul>
        </Section>

        <Section title="Intellectual property">
          <ul className="list-disc pl-6 space-y-2">
            <li>You keep ownership of content you upload (avatars, drop content, copy).</li>
            <li>You grant Imprint a non-exclusive, royalty-free license to display, store, and process your content for the purpose of running the service.</li>
            <li>The Imprint name, logo, code, and protocol are owned by us. Forking or republishing them is not permitted without written consent.</li>
          </ul>
        </Section>

        <Section title="Verification protocol">
          <p>
            Imprint issues signed verification tokens that other systems (Discord bots, ticket vendors, merch stores) can verify via the public verifier endpoint. These tokens are accurate at the time of issuance and expire automatically. We do not warrant that downstream systems will honor every token. Partners agree to the partner terms separately.
          </p>
        </Section>

        <Section title="Pricing and billing">
          <ul className="list-disc pl-6 space-y-2">
            <li>Some features are free. Others (Pro, manager tiers, partner API access) are paid.</li>
            <li>Subscriptions renew automatically until cancelled in settings.</li>
            <li>Refunds are available within 14 days of purchase if no significant feature usage occurred. After that, refunds are at our discretion.</li>
            <li>Taxes are added based on your billing address.</li>
          </ul>
        </Section>

        <Section title="Termination">
          <ul className="list-disc pl-6 space-y-2">
            <li>You can cancel your account at any time. Data is erased per the Privacy policy.</li>
            <li>We can terminate accounts that violate these terms with notice except in emergencies (legal threat, active abuse).</li>
            <li>Upon termination, the verification tokens you issued or carried may be invalidated immediately.</li>
          </ul>
        </Section>

        <Section title="Disclaimers and limits of liability">
          <p>
            Imprint is provided "as is." We do our best to keep it running, secure, and accurate, but we cannot warrant uninterrupted service, total accuracy of Resonance scores, or the actions of third parties (DSPs, partner systems, fans).
          </p>
          <p>
            To the extent permitted by law, our total liability for any claim under these terms is limited to the amount you paid Imprint in the 12 months prior to the claim (or $100, whichever is greater).
          </p>
        </Section>

        <Section title="Disputes">
          <p>
            We will try to resolve disputes by email first (legal@imprint.fan). If we cannot, disputes will be resolved by binding arbitration in the jurisdiction where Imprint is incorporated, except where prohibited by local consumer protection law. EU and UK residents retain all statutory rights.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these terms. We will post material changes here and email you if you have an account. Continued use after the effective date constitutes acceptance.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions: <a className="underline" href="mailto:legal@imprint.fan">legal@imprint.fan</a>. Privacy: <a className="underline" href="mailto:privacy@imprint.fan">privacy@imprint.fan</a>.
          </p>
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl mb-3 text-warm-white" style={{ fontFamily: 'Canela, serif', fontWeight: 300 }}>
        {title}
      </h2>
      <div className="text-vault-muted text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  )
}
