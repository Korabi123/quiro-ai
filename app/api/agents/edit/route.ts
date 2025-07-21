import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { VapiClient } from "@vapi-ai/server-sdk";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const vapi = new VapiClient({
    token: process.env.VAPI_TOKEN!,
  });

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

    const vapiAgent = await vapi.assistants.update(agent.vapiAgent, {
      name,
      model: {
        provider: "openai",
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: instructions,
          }
        ]
      }
    });
    return NextResponse.json({ agent, vapiAgent }, { status: 200 });
  } catch (error) {
    console.log("Error updating agent", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
