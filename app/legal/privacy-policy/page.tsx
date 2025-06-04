import Head from "next/head";

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Quiro</title>
        <meta name="description" content="Privacy Policy for Quiro, your AI assistant platform." />
      </Head>

      
      <main className="max-w-4xl mx-auto px-4 py-12 text-gray-800">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Effective Date: June 4, 2025</p>

        <section className="mb-8">
          <p>
            Welcome to <strong>Quiro</strong> (“we”, “our”, or “us”). Your privacy is important to us.
            This Privacy Policy explains how we collect, use, and protect your information when you
            use our website:{" "}
            <a href="https://quiro-ai-korabii.vercel.app" className="text-blue-600 underline">
              https://quiro-ai-korabii.vercel.app
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
          <ul className="list-disc pl-5">
            <li><strong>Name and Email Address</strong> – during sign up or sign in.</li>
            <li><strong>Payment Information</strong> – collected by Stripe when you upgrade your plan.</li>
            <li><strong>Social Sign-On Data</strong> – from Google or GitHub (e.g., name, email, profile picture).</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">2. How We Collect Information</h2>
          <p>
            We collect your data through:
          </p>
          <ul className="list-disc pl-5 mt-2">
            <li>Manual sign-up and login forms</li>
            <li>OAuth login via Google or GitHub</li>
            <li>Stripe checkout pages for plan upgrades</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">3. Why We Collect Your Data</h2>
          <p>We collect your data because it is necessary to:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Provide account access and services</li>
            <li>Manage billing and subscriptions</li>
            <li>Enable secure login and user management</li>
            <li>Contact you when needed for support or updates</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">4. Sharing of Information</h2>
          <p>
            We do <strong>not</strong> sell or share your personal information for marketing.
            We only share data with:
          </p>
          <ul className="list-disc pl-5 mt-2">
            <li><strong>Stripe</strong> for payment processing</li>
            <li><strong>Google and GitHub</strong> for social authentication</li>
          </ul>
          <p className="mt-2">
            These third parties are required to handle your data securely and in compliance with applicable privacy laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">5. International Users</h2>
          <p>
            Quiro is based in <strong>Kosovo</strong> and operates globally. Your data may be
            transferred to and processed in countries outside of your own, including jurisdictions
            that may not provide the same level of data protection.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">6. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Access your data</li>
            <li>Correct or update your data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing</li>
            <li>Withdraw consent (if applicable)</li>
            <li>File a complaint with your local data authority</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, please email us at:{" "}
            <a href="mailto:contact.korabimeri@gmail.com" className="text-blue-600 underline">
              contact.korabimeri@gmail.com
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">7. Data Retention</h2>
          <p>
            We retain your data only as long as necessary to provide services or as required by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">8. Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your data from
            unauthorized access, disclosure, or misuse.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">9. Children’s Privacy</h2>
          <p>
            Quiro is not intended for children under 13. We do not knowingly collect personal data
            from children.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy occasionally. If changes are significant, we’ll notify
            you via email or our website. The effective date will always be posted at the top.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">11. Contact Us</h2>
          <p>
            For questions or concerns, please contact us at:{" "}
            <a href="mailto:contact.korabimeri@gmail.com" className="text-blue-600 underline">
              contact.korabimeri@gmail.com
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
