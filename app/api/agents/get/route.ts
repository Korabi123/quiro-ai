import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search");
    const id = searchParams.get("id");

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (search) {
      const agents = await prismadb.agent.findMany({
        where: {
          userId: session.user.id,
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive"
              },
            },
          ],
        },
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(agents, { status: 200 });
    }

    if (id) {
      const agent = await prismadb.agent.findFirst({
        where: {
          userId: session.user.id,
          id,
        },
      });

      return NextResponse.json(agent, { status: 200 });
    }

    const agents = await prismadb.agent.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    console.log("ERROR_GETTING_AGENTS: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
