// Imprint privacy policy. Public, no auth.
// Wording uses commas, parentheses, or single dashes only. No em dashes.

export const metadata = {
  title: 'Privacy policy, Imprint',
  description: 'How Imprint handles your data, your fans, and your right to delete.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-warm-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-4xl mb-2 text-warm-white" style={{ fontFamily: 'Canela, serif', fontWeight: 300 }}>
          Privacy
        </h1>
        <p className="text-vault-muted mb-12 text-sm">Last updated: 2026-04-26</p>

        <Section title="Plain version">
          <p>
            Imprint exists so artists own their fan relationships, and fans own their listening identity. Both sides have privacy.
          </p>
          <p>
            We collect what we need to compute Resonance and verify fans. We do not sell, rent, or trade fan data with anyone. We do not run third-party advertising. You can delete your account, your fans, and your tokens at any time.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information you provide (email, name, password hash, OAuth IDs).</li>
            <li>Listening signals you authorize (Spotify top tracks, top artists, recent plays through OAuth).</li>
            <li>Engagement signals from connected platforms (Discord roles, YouTube subscriptions, with consent).</li>
            <li>Drop interactions (open, claim, share) tied to your fan record.</li>
            <li>Operational data (audit logs, error logs, support correspondence).</li>
          </ul>
        </Section>

        <Section title="What we do with it">
          <ul className="list-disc pl-6 space-y-2">
            <li>Compute Resonance scores per fan-artist pair, used to surface real fans to artists.</li>
            <li>Issue cryptographically signed verification tokens that fans carry to other systems (Discord servers, ticket vendors, merch stores).</li>
            <li>Generate aggregate insights (tier mix, fan trajectory, drop performance).</li>
            <li>Service-to-service messaging across the ecosystem (Crucibla, Imperium, Oryx) under shared-secret authentication. The data shared is the minimum required for cross-app features (manager links, royalty events, conviction signals).</li>
            <li>Comply with legal obligations (tax, anti-fraud, fraud-investigation requests).</li>
          </ul>
        </Section>

        <Section title="What we do not do">
          <ul className="list-disc pl-6 space-y-2">
            <li>Sell, rent, or trade fan data to third parties.</li>
            <li>Run third-party advertising or behavioral ad targeting.</li>
            <li>Share individual fan listening with anyone other than the artist that fan has explicitly opted to back.</li>
            <li>Share data with cross-artist managers, labels, or analysts unless an explicit ManagerArtistLink is in ACTIVE state and the artist has accepted.</li>
          </ul>
        </Section>

        <Section title="Your rights">
          <ul className="list-disc pl-6 space-y-2">
            <li>You can read, export, and delete your data at any time via the dashboard.</li>
            <li>If you are an EU, UK, or Brazilian resident, you have GDPR / UK GDPR / LGPD rights including access, rectification, erasure, restriction, portability, and objection.</li>
            <li>If you are a California resident, you have CCPA / CPRA rights to know, delete, correct, and opt out.</li>
            <li>If you delete your account, all fan rows, verification tokens, manager links, and audit logs tied to you are erased within 30 days. Backups are scrubbed within 90 days.</li>
            <li>Email <a className="underline" href="mailto:privacy@imprint.fan">privacy@imprint.fan</a> for any of the above. We respond within 30 days.</li>
          </ul>
        </Section>

        <Section title="Cross-app data sharing inside the ecosystem">
          <p>
            Imprint is part of a broader ecosystem (Crucibla, Imperium, Oryx, Squarp, Subtaste, Resonaet). Where data flows between apps, it does so under one of two contracts:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Service-to-service shared-secret APIs (ECOSYSTEM_API_SECRET) for ecosystem-internal operations like manager-link sync and royalty events. These transmit only the minimum data needed for the feature (typically email and link state).
            </li>
            <li>
              User-initiated webhooks where you explicitly grant Imprint to push or pull from another app. These are listed in your account settings and revocable at any time.
            </li>
          </ul>
        </Section>

        <Section title="Retention">
          <ul className="list-disc pl-6 space-y-2">
            <li>Active accounts: data is retained as long as the account is active.</li>
            <li>Inactive accounts (no sign-in for 24 months): we contact you, then delete after 90 days.</li>
            <li>Deleted accounts: erased within 30 days, scrubbed from backups within 90 days.</li>
            <li>Aggregate, non-identifying analytics may be retained indefinitely.</li>
          </ul>
        </Section>

        <Section title="Security">
          <ul className="list-disc pl-6 space-y-2">
            <li>All traffic encrypted in transit (TLS 1.2 or higher).</li>
            <li>Passwords stored as bcrypt hashes.</li>
            <li>Verification token signing keys stored in a key-management system with rotation.</li>
            <li>Database backups encrypted at rest.</li>
            <li>If we discover a breach affecting your data, we notify you within 72 hours.</li>
          </ul>
        </Section>

        <Section title="Children">
          <p>
            Imprint is not directed at children under 13 (or under 16 in the EU). We do not knowingly collect data from children under those ages. If you believe a child has signed up, email us and we will erase the account.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We will post material changes here and email you if you have an account. Continued use after a change constitutes acceptance. The "Last updated" date at the top is canonical.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Privacy questions or rights requests: <a className="underline" href="mailto:privacy@imprint.fan">privacy@imprint.fan</a>.
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
