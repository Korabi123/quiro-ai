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
import * as React from 'react';

interface WelcomeQuiroProEmailProps {
  recipientName: string;
  startUrl: string;
  subscriptionId?: string;
  planName?: string;
  planPrice?: string;
  referenceId?: string;
  renewsAt?: string
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
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>
          {`
            @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
            
            :root {
              color-scheme: light dark;
              supported-color-schemes: light dark;
            }
          `}
        </style>
      </Head>
      <Preview>You just joined Quiro Pro — let’s get started!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img 
              src="https://quiro-ai.vercel.app/branding/logo-standalone-png.png" 
              height="36"
              alt="Quiro AI Logo"
              style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '10px', width: 'auto' }}
            />
            <Text style={{ display: 'inline-block', verticalAlign: 'middle', fontSize: '22px', fontWeight: '600', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Quiro AI
            </Text>
          </Section>

          <Section style={content}>
            <Section style={gifSection}>
              <Img
                src="https://q1sgth5o59.ufs.sh/f/f17JrmYUJ9CpfoMMgSyYUJ9CpEXM8OTRVtlwKQifasD34g1x"
                alt="Welcome celebration"
                width="100%"
                style={gifImage}
              />
            </Section>

            <Heading style={heading}>Welcome to Quiro Pro</Heading>
            <Text style={paragraph}>
              Hi {recipientName}, thanks for joining! 🚀
            </Text>
            <Text style={paragraph}>
              You now have access to powerful tools designed to make your workflow smoother and smarter.
            </Text>

            <Section style={gradientBox}>
              <Heading as="h3" style={stepsHeading}>
                What’s next?
              </Heading>
              <ul style={stepsList}>
                <li style={stepItem}>✅ Explore your dashboard</li>
                <li style={stepItem}>📚 Generate and manage your agents</li>
                <li style={stepItem}>🤝 Start a meeting</li>
              </ul>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={startUrl}>
                Get Started
              </Button>
            </Section>

            {(subscriptionId || planName || planPrice || referenceId || renewsAt) && (
              <Section style={{ ...gradientBox, marginTop: '24px', padding: '16px' }}>
                <Text style={{ ...paragraph, fontSize: '14px', marginBottom: '8px', color: '#fff', fontWeight: '600' }}>
                  Subscription Details
                </Text>
                <Text style={{ ...paragraph, fontSize: '14px', marginBottom: 0, color: 'rgba(255, 255, 255, 0.6)' }}>
                  {planName && <>Plan: <span style={{color: '#fff'}}>{planName}</span><br/></>}
                  {planPrice && <>Price: <span style={{color: '#fff'}}>{planPrice}</span><br/></>}
                  {renewsAt && <>Renews At: <span style={{color: '#fff'}}>{renewsAt}</span><br/></>}
                  {subscriptionId && <>ID: <span style={{color: '#fff'}}>{subscriptionId}</span><br/></>}
                  {referenceId && <>Ref: <span style={{color: '#fff'}}>{referenceId}</span></>}
                </Text>
              </Section>
            )}

            <Hr style={divider} />

            <Text style={footerText}>
              Need help?{" "}
              <Link href="mailto:contact.korabimeri@gmail.com" style={link}>
                Contact our support team
              </Link>.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerTextSmall}>
              © {new Date().getFullYear()} Quiro AI. All rights reserved.
            </Text>
            <Text style={footerTextSmall}>
              <a href="https://quiro.ai" style={link}>quiro.ai</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ----- styling -----
const main = {
  backgroundColor: '#000000',
  fontFamily:
    'Satoshi, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
  maxWidth: '100%',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const content = {
  padding: '40px',
  backgroundColor: '#171717',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const gifSection = {
  marginBottom: '24px',
  borderRadius: '8px',
  overflow: 'hidden',
};

const gifImage = {
  display: 'block',
  width: '100%',
  maxWidth: '320px',
  margin: '0 auto',
  borderRadius: '8px',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#ffffff',
  marginBottom: '24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: 'rgba(255, 255, 255, 0.8)',
  marginBottom: '16px',
};

const stepsHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#ffffff',
  marginBottom: '16px',
  marginTop: 0,
};

const gradientBox = {
  margin: '24px 0',
  padding: '24px',
  borderRadius: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const stepsList = {
  margin: 0,
  paddingLeft: 0,
  listStyle: 'none',
};

const stepItem = {
  fontSize: '15px',
  color: 'rgba(255, 255, 255, 0.8)',
  marginBottom: '12px',
  lineHeight: '1.5',
};

const buttonContainer = {
  marginTop: '32px',
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#ffffff',
  borderRadius: '9999px',
  color: '#000000',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const divider = {
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: '1px',
  width: '100%',
  margin: '32px 0 24px',
};

const footer = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.6)',
  margin: 0,
};

const link = {
  color: 'rgba(255, 255, 255, 0.8)',
  textDecoration: 'underline',
};

const footerTextSmall = {
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.5)',
  margin: '8px 0',
};

export default WelcomeQuiroProEmail;
