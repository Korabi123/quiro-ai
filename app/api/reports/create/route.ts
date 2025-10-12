import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { withRateLimit } from "@/app/api/rate-limited-routes";

export const POST = withRateLimit(async (req: Request) => {
  try {
    const { name, type, customType, field } = await req.json();
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (type === "CUSTOM" && !customType) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    if (!type || !name || !field) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    const report = await prismadb.report.create({
      data: {
        name,
        type,
        customType,
        field,
        userId: session.user.id,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.log("ERROR CREATING REPORT: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
});
