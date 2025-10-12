// WelcomeQuiroProEmail.tsx
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Link,
  Hr,
  Img,
} from "@react-email/components";

interface WelcomeQuiroProEmailProps {
  recipientName: string;
  startUrl: string;
  subscriptionId?: string; // Stripe subscription ID
  planName?: string;
  planPrice?: string;
  referenceId?: string; // Stripe reference ID
  renewsAt?: string; // Stripe renews at
}

export function WelcomeQuiroProEmail({
  recipientName,
  startUrl,
  subscriptionId,
  planName,
  planPrice,
  referenceId,
  renewsAt,
}: WelcomeQuiroProEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>🎉 You just joined Quiro Pro — let’s get started!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Animated GIF */}
          <Section style={gifSection}>
            <Img
              src="https://q1sgth5o59.ufs.sh/f/f17JrmYUJ9CpfoMMgSyYUJ9CpEXM8OTRVtlwKQifasD34g1x"
              alt="Welcome celebration"
              width="100%"
              style={gifImage}
            />
          </Section>

          {/* Header */}
          <Section style={headerSection}>
            <Heading style={heading}>Welcome to Quiro Pro</Heading>
            <Text style={subheading}>
              Hi {recipientName}, thanks for joining! 🚀
              You now have access to powerful tools designed to make your workflow smoother and smarter.
            </Text>
          </Section>

          {/* What's Next */}
          <Section style={stepsSection}>
            <Heading as="h3" style={stepsHeading}>
              What’s next?
            </Heading>
            <ul style={stepsList}>
              <li style={stepItem}>✅ Explore your dashboard</li>
              <li style={stepItem}>📚 Learn from quick start guides</li>
              <li style={stepItem}>🤝 Connect with the Quiro Pro community</li>
            </ul>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={button} href={startUrl}>
              Get Started
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Need help?{" "}
              <Link href="mailto:support@quiropro.com" style={footerLink}>
                Contact our support team
              </Link>
              .
            </Text>

            {/* Subscription details */}
            {(subscriptionId || planName || planPrice || referenceId || renewsAt) && (
              <Text style={subscriptionDetails}>
                {subscriptionId && <>Subscription ID: {subscriptionId}<br/></>}
                {referenceId && <>Reference ID: {referenceId}<br/></>}
                {planName && <>Plan: {planName}<br/></>}
                {planPrice && <>Price: {planPrice}</>}
                {renewsAt && <>Renews At: {renewsAt}</>}
              </Text>
            )}

            <Text style={footerTextSmall}>© 2025 Quiro Pro.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ----- styling -----
const main = {
  backgroundColor: "#F9FAFB",
  fontFamily: "'Arial', sans-serif",
  color: "#333333",
  margin: 0,
  padding: 0,
};

const container = {
  width: "100%",
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
};

const gifSection = {
  textAlign: "center" as const,
  backgroundColor: "#F9FAFB",
};

const gifImage = {
  display: "block",
  maxWidth: "600px",
  margin: "0 auto",
};

const headerSection = {
  padding: "24px",
  textAlign: "center" as const,
};

const heading = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 700,
  color: "#111827",
};

const subheading = {
  marginTop: "12px",
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4B5563",
};

const stepsSection = {
  padding: "0 24px 24px 24px",
};

const stepsHeading = {
  fontSize: "18px",
  fontWeight: 600,
  marginBottom: "12px",
};

const stepsList = {
  margin: 0,
  paddingLeft: "20px",
};

const stepItem = {
  fontSize: "14px",
  color: "#374151",
  marginBottom: "6px",
};

const ctaSection = {
  padding: "0 24px 32px 24px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#10B981",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: 500,
};

const divider = {
  borderColor: "#E5E7EB",
  borderWidth: "1px",
  width: "100%",
  margin: "0",
};

const footerSection = {
  padding: "16px 24px 24px 24px",
  textAlign: "center" as const,
};

const footerText = {
  margin: 0,
  fontSize: "14px",
  color: "#6B7280",
  lineHeight: "20px",
};

const subscriptionDetails = {
  marginTop: "8px",
  fontSize: "12px",
  color: "#9CA3AF",
  lineHeight: "18px",
};

const footerTextSmall = {
  marginTop: "8px",
  fontSize: "12px",
  color: "#9CA3AF",
};

const footerLink = {
  color: "#10B981",
  textDecoration: "underline",
};

export default WelcomeQuiroProEmail;
