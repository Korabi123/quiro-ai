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
