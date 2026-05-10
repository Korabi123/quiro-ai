"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

export default function TestEmailsPage() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/test-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Failed to send test emails");
      }

      toast.success("Successfully sent all 6 test emails!");
      setEmail("");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while sending the test emails.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 font-satoshi text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-white/10 text-white">
            <Mail className="size-6" />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
            Email Template Tester
          </h1>
          <p className="text-sm text-gray-400">
            Enter an email address to receive all 6 of the new dark mode email templates instantly.
          </p>
        </div>

        <form onSubmit={handleSendTest} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
              Recipient Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white transition-colors placeholder:text-gray-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSending || !email}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-100 disabled:bg-white/50"
          >
            {isSending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Send All 6 Templates
              </>
            )}
          </button>
        </form>

        <div className="mt-8 rounded-lg bg-black/30 p-4 text-xs text-gray-500">
          <strong>Templates included:</strong>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Newsletter Welcome</li>
            <li>Recent Login Alert</li>
            <li>Two-Factor Authentication (OTP)</li>
            <li>Password Reset</li>
            <li>Subscription Started</li>
            <li>Subscription Cancelled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
