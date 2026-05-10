import { NextResponse } from 'next/server';
import { Resend } from 'resend';

import NewsletterWelcomeEmail from '@/components/emails/newsletter-welcome';
import RecentLoginEmail from '@/components/emails/recent-login';
import ResetPasswordEmail from '@/components/emails/reset-password';
import WelcomeQuiroProEmail from '@/components/emails/subscription-started';
import SubscriptionCancelledEmail from '@/components/emails/subscription-cancelled';
import TwoFactorEmail from '@/components/emails/two-factor-auth';
import PasswordChangedEmail from '@/components/emails/password-changed';
import TwoFactorAddedEmail from '@/components/emails/two-factor-added';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    const promises = [
      resend.emails.send({
        from: 'no-reply@korabimeri.work.gd',
        to: [email],
        subject: 'TEST: Welcome to Quiro AI Updates',
        react: NewsletterWelcomeEmail(),
      }),
      resend.emails.send({
        from: 'quiro-auth@korabimeri.work.gd',
        to: [email],
        subject: 'TEST: Recent login to your account',
        react: RecentLoginEmail({
          userFirstName: 'TestUser',
          loginDate: new Date(),
          loginDevice: 'Mac OS, Chrome',
          loginLocation: 'San Francisco, CA',
          loginIp: '192.168.1.1'
        }),
      }),
      resend.emails.send({
        from: 'quiro-auth@korabimeri.work.gd',
        to: [email],
        subject: 'TEST: Password Reset Request',
        react: ResetPasswordEmail({
          userFirstName: 'TestUser',
          resetLink: 'https://quiro.ai/reset-password/test-token-123'
        }),
      }),
      resend.emails.send({
        from: 'no-reply@korabimeri.work.gd',
        to: [email],
        subject: 'TEST: Welcome to Quiro Pro!',
        react: WelcomeQuiroProEmail({
          recipientName: 'TestUser',
          startUrl: 'https://quiro.ai/dashboard',
          planName: 'Pro Annual',
          planPrice: '$99.00',
          subscriptionId: 'sub_test12345',
          renewsAt: new Date(Date.now() + 31536000000).toLocaleDateString()
        }),
      }),
      resend.emails.send({
        from: 'quiro-auth@korabimeri.work.gd',
        to: [email],
        subject: 'TEST: Your Login Verification Code',
        react: TwoFactorEmail({
          otp: '482015'
        }),
      }),
      resend.emails.send({
        from: 'no-reply@korabimeri.work.gd',
        to: [email],
        subject: 'TEST: Your Quiro Pro Subscription',
        react: SubscriptionCancelledEmail({
          recipientName: 'TestUser',
          endDate: new Date(Date.now() + 2592000000).toLocaleDateString(),
          reactivateUrl: 'https://quiro.ai/dashboard/billing'
        }),
      }),
      resend.emails.send({
        from: 'quiro-auth@korabimeri.work.gd',
        to: [email],
        subject: 'TEST: Your password has been changed',
        react: PasswordChangedEmail(),
      }),
      resend.emails.send({
        from: 'quiro-auth@korabimeri.work.gd',
        to: [email],
        subject: 'TEST: Two-Step Verification Added',
        react: TwoFactorAddedEmail({
          methodType: 'Authenticator app'
        }),
      })
    ];

    const results = await Promise.all(promises);

    const hasError = results.some(r => r.error);
    if (hasError) {
      console.error("[TEST_EMAILS_ERROR]", results.filter(r => r.error));
      return NextResponse.json({ error: "Failed to send one or more emails" }, { status: 500 });
    }

    return NextResponse.json({ success: true, results: results.map(r => r.data) });
  } catch (error) {
    console.error("[TEST_EMAILS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
