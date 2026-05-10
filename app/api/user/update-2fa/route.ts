import { auth } from "@/auth";
import prisma from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import TwoFactorAddedEmail from "@/components/emails/two-factor-added";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.json();
    const { action, provider, password } = data; // action: "enable" | "disable" | "setDefault"
    
    const user = await prisma.user.findUnique({ where: { id: session.user.id }});
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // If password is provided, we verify it
    if (password) {
      const accounts = await prisma.account.findMany({ where: { userId: user.id }});
      const hasCredential = accounts.some(acc => acc.providerId === "credential");
      if (hasCredential) {
        // Just verify by fetching user with password using signIn
        try {
           const verifyRes = await auth.api.signInEmail({
             body: { email: user.email, password },
             headers: req.headers
           });
           if (!verifyRes || ("twoFactorRedirect" in verifyRes) === false && verifyRes.user?.id !== user.id) {
             return new NextResponse("Invalid password", { status: 400 });
           }
        } catch (err: any) {
           return new NextResponse(err.message || "Invalid password", { status: 400 });
        }
      }
    }

    let updateData: any = {};

    if (action === "enable") {
      if (provider === "email") {
        updateData.emailTwoFactorEnabled = true;
        if (!user.defaultTwoFactorMethod) updateData.defaultTwoFactorMethod = "email";
      } else if (provider === "totp") {
        updateData.totpTwoFactorEnabled = true;
        if (!user.defaultTwoFactorMethod) updateData.defaultTwoFactorMethod = "totp";
      }
    } else if (action === "disable") {
      if (provider === "email") {
        updateData.emailTwoFactorEnabled = false;
        if (user.defaultTwoFactorMethod === "email") {
           // Fallback to totp if totp is enabled, otherwise null
           updateData.defaultTwoFactorMethod = user.totpTwoFactorEnabled ? "totp" : null;
        }
      } else if (provider === "totp") {
        updateData.totpTwoFactorEnabled = false;
        if (user.defaultTwoFactorMethod === "totp") {
           updateData.defaultTwoFactorMethod = user.emailTwoFactorEnabled ? "email" : null;
        }
      }
      
      // If both are disabled, disable Better Auth 2FA globally
      const newEmailState = updateData.emailTwoFactorEnabled ?? user.emailTwoFactorEnabled;
      const newTotpState = updateData.totpTwoFactorEnabled ?? user.totpTwoFactorEnabled;
      
      if (!newEmailState && !newTotpState) {
        updateData.twoFactorEnabled = false;
      }
    } else if (action === "setDefault") {
       updateData.defaultTwoFactorMethod = provider;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    if (action === "enable") {
      try {
        await resend.emails.send({
          from: 'quiro-auth@korabimeri.work.gd',
          to: user.email,
          subject: 'Two-Step Verification Added',
          react: TwoFactorAddedEmail({
            methodType: provider === "email" ? "Email verification" : "Authenticator app"
          }),
        });
      } catch (e) {
        console.error("Failed to send 2FA added email:", e);
      }
    }

    return NextResponse.json({ success: true, updateData });
  } catch (error: any) {
    console.error("Failed to update 2FA state:", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
