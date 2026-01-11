/* eslint-disable @typescript-eslint/no-unused-vars */
// BetterAuth config file

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { multiSession, twoFactor } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import ResetPasswordEmail from "./components/emails/reset-password";

import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import WelcomeQuiroProEmail from "./components/emails/subscription-started";
import { emailHarmony } from 'better-auth-harmony';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      streak: {
        type: "number",
        defaultValue: 0,
      },
      lastStreakUpdate: {
        type: "date",
        required: false
      }
    }
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, token, url }, request) => {
      await resend.emails.send({
        to: user.email,
        from: "auth@korabimeri.work.gd",
        subject: "Reset your password",
        react: ResetPasswordEmail({
          resetLink: url,
          userFirstName: user.name,
        }),
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, token, url }, request) => {
      await resend.emails.send({
        to: user.email,
        from: "auth@korabimeri.work.gd",
        subject: "Verify your email",
        text: `Click here to verify your email: ${url}`,
      });
    },
  },
  appName: "quiro",
  plugins: [
    twoFactor({
      issuer: "quiro",
      otpOptions: {
        async sendOTP({ user, otp }, request) {
          await resend.emails.send({
            to: user.email,
            from: "auth@korabimeri.work.gd",
            subject: "Your Login Verification Code",
            text: `Your login verification code is: ${otp}`,
          });
        },
      },
    }),
    emailHarmony(),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "pro",
            priceId: process.env.STRIPE_PRO_SUB_ID,
            lookupKey: process.env.STRIPE_PRO_SUB_LOOKUP,
          },
        ],

        getCheckoutSessionParams: async () => {
          return {
            params: {
              allow_promotion_codes: true,
            },
          };
        },

        onSubscriptionComplete: async ({
          event,
          subscription,
          stripeSubscription,
          plan,
        }) => {
          const user = await prisma.user.findFirst({
            where: {
              stripeCustomerId: subscription.stripeCustomerId,
            },
          });

          if (user) {
            await resend.emails.send({
              to: user.email,
              from: "billing@korabimeri.work.gd",
              subject: `🎉 You just joined Quiro ${plan.name} — let’s get started!`,
              react: WelcomeQuiroProEmail({
                recipientName: user.name,
                startUrl: `${process.env.BETTER_AUTH_URL}/meetings`,
                subscriptionId: stripeSubscription.id,
                planName: plan.name,
                planPrice: "10€/month",
                referenceId: subscription.referenceId,
                renewsAt: subscription?.periodEnd?.toLocaleDateString(),
              }),
            });
          }
        },

        onSubscriptionCancel: async ({
          event,
          subscription,
          stripeSubscription,
          cancellationDetails,
        }) => {
          const user = await prisma.user.findFirst({
            where: {
              stripeCustomerId: subscription.stripeCustomerId,
            },
          });

          if (user) {
            await resend.emails.send({
              to: user.email,
              from: "billing@korabimeri.work.gd",
              subject: "Your quiro subscription has been canceled",
              text: `Your quiro subscription has been canceled`,
            });
          }
        },
      },
    }),
    passkey({
      rpID: "localhost",
      rpName: "quiro",
      origin: "http://localhost:3000",
    }),
    multiSession(),
  ],
});
