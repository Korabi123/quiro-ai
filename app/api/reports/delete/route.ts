import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId");
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!reportId) {
      return new NextResponse("Report ID not found", { status: 404 });
    }

    await prismadb.report.delete({
      where: {
        id: reportId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("Error deleting report", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
