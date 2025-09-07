import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const idParam = searchParams.get("id");
    const session = await auth.api.getSession(req);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (search) {
      const reports = await prismadb.report.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive"
              },
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          questions: true
        }
      });

      return NextResponse.json(reports);
    }

    if (idParam) {
      const report = await prismadb.report.findUnique({
        where: {
          id: idParam,
          userId: session.user.id,
        },
        include: {
          questions: {
            include: {
              rubric: true,
            },
          },
        },
      });

      if (!report) {
        return new NextResponse("Report not found", { status: 404 });
      }

      return NextResponse.json(report);
    }

    const reports = await prismadb.report.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.log("ERROR GETTING REPORTS: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
