import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId");
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!reportId) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    const questions = await prismadb.question.findMany({
      where: {
        reportId,
        //* Questions are reached through their report, so ownership is asserted
        //* on the parent rather than on the question itself - `Question` has no
        //* userId column.
        //*
        //* Without this, any authenticated user could read another user's
        //* questions and rubrics simply by passing their reportId. Returns []
        //* rather than 404 so this endpoint's shape is unchanged for the client.
        report: { userId: session.user.id },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        rubric: true,
      }
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.log("ERROR GETTING QUESTIONS: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
