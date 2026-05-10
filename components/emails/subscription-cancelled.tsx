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

interface SubscriptionCancelledEmailProps {
  recipientName: string;
  endDate: string;
  reactivateUrl: string;
}

export function SubscriptionCancelledEmail({
  recipientName,
  endDate,
  reactivateUrl,
}: SubscriptionCancelledEmailProps) {
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
      <Preview>Your Quiro Pro subscription has been cancelled.</Preview>
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
            <Heading style={heading}>Subscription Cancelled</Heading>
            <Text style={paragraph}>
              Hi {recipientName},
            </Text>
            <Text style={paragraph}>
              We're sorry to see you go! Your Quiro Pro subscription has been successfully cancelled.
            </Text>
            
            <Section style={gradientBox}>
              <Text style={{ ...paragraph, marginBottom: 0, color: '#ffffff', fontWeight: '500' }}>
                You will still have full access to all Pro features until the end of your current billing cycle on <strong>{endDate}</strong>. After that date, your account will be downgraded to the free tier.
              </Text>
            </Section>

            <Text style={paragraph}>
              If you change your mind, you can reactivate your subscription at any time.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={reactivateUrl}>
                Reactivate Subscription
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={footerText}>
              Have feedback on how we can improve?{" "}
              <Link href="mailto:contact.korabimeri@gmail.com" style={link}>
                Let us know!
              </Link>
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

const gradientBox = {
  margin: '24px 0',
  padding: '24px',
  borderRadius: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
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

export default SubscriptionCancelledEmail;
