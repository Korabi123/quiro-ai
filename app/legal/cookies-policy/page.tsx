import Head from "next/head";

export default function CookiesPolicy() {
  return (
    <>
      <Head>
        <title>Cookies Policy | Quiro</title>
        <meta name="description" content="Quiro's policy on cookies and how we use them." />
      </Head>
      <main className="max-w-4xl mx-auto px-4 py-12 text-gray-800">
        <h1 className="text-4xl font-bold mb-6">Cookies Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Effective Date: June 4, 2025</p>

        <section className="mb-8">
          <p>
            This Cookies Policy explains how <strong>Quiro</strong> ("we", "us", or "our") uses
            cookies and similar technologies on our website:{" "}
            <a href="https://quiro-ai-korabii.vercel.app" className="text-blue-600 underline">
              quiro-ai-korabii.vercel.app
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device that help us remember preferences,
            recognize returning users, and improve your experience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">2. Types of Cookies We Use</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Essential Cookies:</strong> Enable core functionality like sign-in,
              session management, and payments (Stripe).
            </li>
            <li>
              <strong>Authentication Cookies:</strong> Used when logging in with Google or GitHub.
            </li>
            <li>
              <strong>Functional Cookies:</strong> Save user preferences like theme or locale.
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Not currently used, but may be in the future to
              monitor usage and improve performance.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">3. Third-Party Cookies</h2>
          <p>We use the following third-party services that may set cookies:</p>
          <ul className="list-disc pl-5 mt-2">
            <li><strong>Stripe</strong> – for payment processing</li>
            <li><strong>Google & GitHub</strong> – for authentication</li>
            <li><strong>Vercel</strong> – for hosting and analytics</li>
            <li><strong>OpenAI</strong> – for AI processing features</li>
            <li><strong>Google AI</strong> – for AI processing features</li>
            <li><strong>Vapi</strong> – for voice AI processing</li>
            <li><strong>UploadThing</strong> – for file storage</li>
          </ul>
          <p className="mt-2">These services help us provide core functionality and enhance your experience with our application.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">4. How to Manage Cookies</h2>
          <p>
            You can manage cookies in your browser settings. Disabling cookies may affect
            functionality. Refer to your browser documentation for details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">5. Technology-Specific Cookies</h2>
          <p>
            Our application uses Next.js and React, which may set cookies for:
          </p>
          <ul className="list-disc pl-5 mt-2">
            <li>Session management</li>
            <li>State persistence</li>
            <li>Performance optimization</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">6. Changes to This Policy</h2>
          <p>
            We may update this policy as needed. Changes will be posted on this page with a revised
            effective date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">7. Contact Us</h2>
          <p>
            If you have any questions, contact us at:{" "}
            <a href="mailto:contact.korabimeri@gmail.com" className="text-blue-600 underline">
              contact.korabimeri@gmail.com
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
