import Head from "next/head";

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms & Conditions | Quiro</title>
        <meta name="description" content="Terms and Conditions for using Quiro." />
      </Head>
      <main className="max-w-4xl mx-auto px-4 py-12 text-gray-800">
        <h1 className="text-4xl font-bold mb-6">Terms & Conditions</h1>
        <p className="text-sm text-gray-500 mb-10">Effective Date: June 4, 2025</p>

        <section className="mb-8">
          <p>
            By accessing or using <strong>Quiro</strong> ("we", "us", or "our"), you agree to be
            bound by these Terms and Conditions. If you do not agree, please do not use our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">1. Use of the Service</h2>
          <p>You must be at least 13 years old and agree not to:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Use the service unlawfully</li>
            <li>Access our systems without authorization</li>
            <li>Reverse-engineer or duplicate our platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">2. Account Registration</h2>
          <p>
            You may sign up with email or social login (Google, GitHub). You’re responsible for
            maintaining account security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">3. Subscription and Payments</h2>
          <p>
            Certain features require a paid plan. Payments are processed by Stripe. We may change
            pricing at any time with notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">4. Intellectual Property</h2>
          <p>
            All content on Quiro is owned by us or our licensors. You may not copy, reuse, or
            distribute any part without permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">5. Termination</h2>
          <p>
            We may suspend or terminate your access at our discretion for any violation of these
            Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">6. Limitation of Liability</h2>
          <p>
            We are not liable for indirect or incidental damages related to your use of the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">7. Disclaimer</h2>
          <p>
            The service is provided “as is.” We make no guarantees about its reliability or
            availability.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">8. Privacy</h2>
          <p>
            Your data is governed by our{" "}
            <a href="/legal/privacy-policy" className="text-blue-600 underline">
              Privacy Policy
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">9. Changes to These Terms</h2>
          <p>
            We may update these Terms. Continued use after updates implies agreement to the new
            version.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">10. Governing Law</h2>
          <p>These Terms are governed by the laws of Kosovo.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">11. Contact</h2>
          <p>
            Questions? Contact us at{" "}
            <a href="mailto:contact.korabimeri@gmail.com" className="text-blue-600 underline">
              contact.korabimeri@gmail.com
            </a>
            .
          </p>
        </section>
      </main>
    </>
  );
}
