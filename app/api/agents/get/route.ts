import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const agents = await prismadb.agent.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.log("ERROR_GETTING_AGENTS: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
