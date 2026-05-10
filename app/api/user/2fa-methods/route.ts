import prismadb from "@/lib/prismadb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const user = await prismadb.user.findUnique({
    where: { email },
    select: {
      totpTwoFactorEnabled: true,
      emailTwoFactorEnabled: true,
      defaultTwoFactorMethod: true,
    }
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const methods = [];
  if (user.totpTwoFactorEnabled) methods.push("totp");
  if (user.emailTwoFactorEnabled) methods.push("email");

  return NextResponse.json({
    methods,
    defaultMethod: user.defaultTwoFactorMethod || (methods.length > 0 ? methods[0] : null)
  });
}
