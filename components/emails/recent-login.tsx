import {
  Body,
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

interface RecentLoginEmailProps {
  userFirstName?: string;
  loginDate?: Date;
  loginDevice?: string;
  loginLocation?: string;
  loginIp?: string;
}

export const RecentLoginEmail = ({
  userFirstName,
  loginDate,
  loginDevice,
  loginLocation,
  loginIp,
}: RecentLoginEmailProps) => {
  const formattedDate = loginDate ? new Intl.DateTimeFormat('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(loginDate) : '';

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
      <Preview>Recent login to your Quiro AI account</Preview>
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
              We noticed a recent login to your Quiro AI account.
            </Text>

            <Section style={detailsBox}>
              <Text style={{ ...paragraph, marginBottom: '8px' }}>
                <strong style={strong}>Time:</strong> {formattedDate}
              </Text>
              <Text style={{ ...paragraph, marginBottom: '8px' }}>
                <strong style={strong}>Device:</strong> {loginDevice}
              </Text>
              <Text style={{ ...paragraph, marginBottom: '8px' }}>
                <strong style={strong}>Location:</strong> {loginLocation}
              </Text>
              <Text style={footnote}>
                *Approximate geographic location based on IP address: {loginIp}
              </Text>
            </Section>

            <Text style={paragraph}>
              If this was you, there's nothing else you need to do.
            </Text>
            <Text style={paragraph}>
              If this wasn't you, please reset your password immediately and enable 2FA.
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

export default RecentLoginEmail;

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

const strong = {
  color: '#ffffff',
  fontWeight: '600',
};

const detailsBox = {
  margin: '32px 0',
  padding: '24px',
  borderRadius: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const footnote = {
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.4)',
  marginTop: '12px',
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
