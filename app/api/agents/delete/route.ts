import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return new NextResponse("Missing agentId", { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const agent = await prismadb.agent.delete({
      where: {
        id: agentId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(agent, { status: 200 });
  } catch (error) {
    console.log("Error deleting agent", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
