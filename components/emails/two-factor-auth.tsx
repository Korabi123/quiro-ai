import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Hr,
  Img,
} from "@react-email/components";
import * as React from 'react';

interface TwoFactorEmailProps {
  otp: string;
}

export function TwoFactorEmail({
  otp,
}: TwoFactorEmailProps) {
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
      <Preview>Your Quiro AI Login Verification Code</Preview>
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
            <Heading style={heading}>Login Verification</Heading>
            <Text style={paragraph}>
              Please use the verification code below to securely log in to your Quiro AI account.
            </Text>
            
            <Section style={otpBox}>
              <Text style={otpText}>
                {otp}
              </Text>
            </Section>

            <Text style={paragraph}>
              This code will expire shortly. Do not share this code with anyone.
            </Text>
            <Text style={warningText}>
              If you did not request this login attempt, please change your password immediately or contact our support team.
            </Text>

            <Hr style={divider} />

            <Text style={footerText}>
              Security alert from Quiro AI.
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

const warningText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: 'rgba(255, 255, 255, 0.5)',
  marginBottom: '16px',
};

const otpBox = {
  margin: '32px 0',
  padding: '24px',
  borderRadius: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  textAlign: 'center' as const,
};

const otpText = {
  fontSize: '40px',
  fontWeight: '700',
  color: '#ffffff',
  letterSpacing: '8px',
  margin: 0,
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

export default TwoFactorEmail;
