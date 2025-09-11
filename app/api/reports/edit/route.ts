import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { name, type, customType, field, reportId } = await req.json();
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!reportId) {
      return new NextResponse("Report ID not found", { status: 404 });
    }

    if (type === "CUSTOM" && !customType) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    if (!type || !name || !field) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    const report = await prismadb.report.update({
      where: {
        id: reportId,
        userId: session.user.id,
      },
      data: {
        name,
        type,
        customType,
        field,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.log("ERROR UPDATING REPORT: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}