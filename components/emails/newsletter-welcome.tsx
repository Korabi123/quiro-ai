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
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

export const NewsletterWelcomeEmail = () => {
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
      <Preview>Welcome to Quiro AI Product Updates!</Preview>
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
              You're on the list!
            </Heading>
            <Text style={paragraph}>
              Thanks for subscribing to Quiro AI product updates.
            </Text>
            <Text style={paragraph}>
              We are working hard to build the best interview-prep workflow, featuring daily coding problems, AI mock interviews, and actionable skill reports.
            </Text>
            
            <Section style={gradientBox}>
              <Text style={{...paragraph, textAlign: 'center', marginBottom: 0 }}>
                Stay tuned for our upcoming feature releases, new problem sets, and interview modes.
              </Text>
            </Section>

            <Text style={paragraph}>
              If you haven't already, start preparing today.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href="https://quiro.ai/sign-up">
                Start free practice
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Occasional updates from Quiro AI.
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

export default NewsletterWelcomeEmail;

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

const gradientBox = {
  margin: '32px 0',
  padding: '24px',
  borderRadius: '12px',
  background: `linear-gradient(135deg, rgba(253, 186, 116, 0.15) 0%, rgba(234, 88, 12, 0.15) 100%)`,
  border: `1px solid rgba(251, 146, 60, 0.3)`,
};

const buttonContainer = {
  marginTop: '32px',
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
