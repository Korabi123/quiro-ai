import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import NewsletterWelcomeEmail from '@/components/emails/newsletter-welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'no-reply@korabimeri.work.gd',
      to: [email],
      subject: 'Welcome to Quiro AI Updates',
      react: NewsletterWelcomeEmail(),
    });

    if (error) {
      console.error("[NEWSLETTER_ERROR]", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[NEWSLETTER_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
