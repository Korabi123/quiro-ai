import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import PasswordChangedEmail from '@/components/emails/password-changed';
import { auth } from '@/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    let email: string | null = null;
    try {
      const body = await req.json();
      email = body?.email;
    } catch(e) {}

    if (!email) {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user) {
        email = session.user.email;
      }
    }

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'quiro-auth@korabimeri.work.gd',
      to: [email],
      subject: 'Your password has been changed',
      react: PasswordChangedEmail(),
    });

    if (error) {
      console.error("[PASSWORD_CHANGED_EMAIL_ERROR]", error);
      return new NextResponse("Failed to send email", { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[PASSWORD_CHANGED_EMAIL_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
