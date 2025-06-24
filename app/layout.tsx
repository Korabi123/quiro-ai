import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

import localFont from "next/font/local";

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
  title: "quiro AI",
  description: "Train for real interviews with daily coding problems, AI-powered mock calls, and tailored skill checks — all in one app.",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
