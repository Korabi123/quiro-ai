import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return new NextResponse("Password must be at least 8 characters", { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await auth.api.setPassword({
      body: {
        newPassword
      },
      headers: req.headers
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to set password:", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
