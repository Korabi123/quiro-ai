import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface Props {
  userFirstName?: string;
  resetLink?: string;
}

export const ResetPasswordEmail = ({
  userFirstName,
  resetLink,
}: Props) => {

  return (
    <Html>
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
      <Preview>Your password reset link</Preview>
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
            <Heading style={heading}>
              Hi {userFirstName},
            </Heading>
            <Text style={paragraph}>
              You've requested a password reset link for your Quiro AI account.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={resetLink}>
                Reset your password
              </Button>
            </Section>

            <Text style={paragraph}>
              If this was you, click the button above to reset your password.
            </Text>
            <Text style={paragraph}>
              If this wasn't you, please ignore this email or reach out to support. We strongly recommend enabling 2FA.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Security alert from Quiro AI.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Quiro AI. All rights reserved.
            </Text>
            <Text style={footerText}>
              <a href="https://quiro.ai" style={link}>quiro.ai</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPasswordEmail;

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
  marginBottom: '20px',
};

const buttonContainer = {
  marginTop: '32px',
  marginBottom: '32px',
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

const footer = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.5)',
  margin: '8px 0',
};

const link = {
  color: 'rgba(255, 255, 255, 0.8)',
  textDecoration: 'underline',
};
