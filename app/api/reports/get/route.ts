import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
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
        }
      });

      return NextResponse.json(reports);
    }

    const reports = await prismadb.report.findMany();

    return NextResponse.json(reports);
  } catch (error) {
    console.log("ERROR GETTING REPORTS: ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
