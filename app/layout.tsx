import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

import localFont from "next/font/local";
import { DialogProvider } from "@/components/provider/dialog-provider";
import { Analytics } from "@vercel/analytics/next";

const satoshi = localFont({
  src: [
    {
      path: "../public/Satoshi-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/Satoshi-Light_Italic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/Satoshi-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/Satoshi-Medium_Italic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/Satoshi-Bold_Italic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/Satoshi-Black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../public/Satoshi-Black_Italic.woff2",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Quiro AI - Ace Your Interviews with AI-Powered Prep",
    template: "%s | Quiro AI",
  },
  description: "Quiro AI offers daily coding problems, AI-powered mock interviews, and tailored skill checks to help you ace your technical interviews. Prepare effectively for your dream job with our comprehensive platform.",
  openGraph: {
    type: "website",
    url: "https://quiro-ai.vercel.app",
    title: "Quiro AI - Ace Your Interviews with AI-Powered Prep",
    description: "Quiro AI offers daily coding problems, AI-powered mock interviews, and tailored skill checks to help you ace your technical interviews. Prepare effectively for your dream job with our comprehensive platform.",
    images: [
      {
        url: "https://i.ibb.co/DDGQ0BpC/ogimage.png", // Absolute URL for Open Graph image
        width: 1200,
        height: 630,
        alt: "Quiro AI - Interview Preparation Platform",
      },
    ],
    locale: "en_US",
    siteName: "Quiro AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiro AI - Ace Your Interviews with AI-Powered Prep",
    description: "Quiro AI offers daily coding problems, AI-powered mock interviews, and tailored skill checks to help you ace your technical interviews. Prepare effectively for your dream job with our comprehensive platform.",
    images: ["https://i.ibb.co/DDGQ0BpC/ogimage.png"], // Absolute URL for Twitter image
    creator: "@quiro_ai", // Assuming a Twitter handle exists
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  keywords: [
    "Quiro AI",
    "interview preparation",
    "coding problems",
    "AI mock interviews",
    "skill checks",
    "technical interview",
    "career success",
    "job preparation",
    "software engineering interview",
  ],
  applicationName: "Quiro AI",
  creator: "korabimeri",
  publisher: "Quiro AI", // Added publisher
  alternates: {
    canonical: "https://quiro-ai.vercel.app", // Added canonical URL
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${satoshi.variable} font-satoshi antialiased h-full w-full`}
      >
        <DialogProvider />
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
