import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { name, field, type, customType, reportId } = await req.json();
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!name || !field || !type || !reportId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (type === "CUSTOM" && !customType) {
      return new NextResponse("Custom type is required", { status: 400 });
    }

    const report = await prismadb.report.update({
      where: {
        id: reportId,
        userId: session.user.id,
      },
      data: {
        name,
        field,
        type,
        customType,
        questions: undefined,
        breakdown: null,
        summary: null,
      }
    });

    await prismadb.question.deleteMany({
      where: {
        reportId: reportId,
      }
    });

    const questions = await prismadb.question.findMany({
      where: {
        reportId: reportId,
      },
    });

    questions.map((question) => {
      return prismadb.rubric.deleteMany({
        where: {
          question: {
            id: question.id,
          }
        },
      });
    });

    return new NextResponse(JSON.stringify(report), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log("ERROR_PATCHING_REPORT: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
