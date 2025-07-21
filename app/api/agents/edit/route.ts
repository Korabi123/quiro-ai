import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { name, instructions, agentId } = await req.json();
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!name || !instructions) {
      return new NextResponse("Missing name or instructions", { status: 400 });
    }

    const agent = await prismadb.agent.update({
      where: {
        id: agentId,
        userId: session.user.id,
      },
      data: {
        name,
        instructions,
      },
    });

    return NextResponse.json(agent, { status: 200 });
  } catch (error) {
    console.log("Error updating agent", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
