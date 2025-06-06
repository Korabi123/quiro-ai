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

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, token, url }, request) => {
      await resend.emails.send({
        to: user.email,
        from: 'no-reply@korabimeri.work.gd',
        subject: 'Reset your password',
        react: ResetPasswordEmail({
          resetLink: url,
          userFirstName: user.name,
        })
      });
    }
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, token, url }, request) => {
      await resend.emails.send({
        to: user.email,
        from: 'no-reply@korabimeri.work.gd',
        subject: 'Verify your email',
        text: `Click here to verify your email: ${url}`,
      });
    }
  },
  appName: "quiro",
  plugins: [
    twoFactor({
      issuer: "quiro",
      otpOptions: {
        async sendOTP({ user, otp }, request) {
          await resend.emails.send({
            to: user.email,
            from: 'no-reply@korabimeri.work.gd',
            subject: 'Your Login Verification Code',
            text: `Your login verification code is: ${otp}`,
          });
        }
      }
    }),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "basic",
            priceId: "price_1RWvCtGIU78OhkESsOV9YJQs",
            limits: {
              agents: 3,
              callTranscripts: 1,
              chats: 10,
              monthlyProblems: 1,
              callRec: 0,
              skillEval: 0,
              tailoredTips: 0,
              dailyProblems: 0,
              support: 0,
            }
          },
          {
            name: "pro",
            priceId: "price_1RWvJyGIU78OhkESZnnMhSe",
            limits: {
              agents: Infinity,
              callTranscripts: Infinity,
              chats: Infinity,
              callRec: Infinity,
              skillEval: Infinity,
              tailoredTips: Infinity,
              dailyProblems: Infinity,
              support: Infinity,
            }
          },
        ]
      }
    }),
    passkey({
      rpID: "localhost",
      rpName: "quiro",
      origin: "http://localhost:3000",
    }),
    multiSession(),
  ],
});
