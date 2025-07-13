import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";

import { VapiClient } from "@vapi-ai/server-sdk";

export async function POST(req: Request) {
  const vapi = new VapiClient({
    token: process.env.VAPI_TOKEN!,
  });

  const voiceArrs = [
    "21m00Tcm4TlvDq8ikWAM",
    "6F5Zhi321D3Oq7v1oNT4",
    "NBqeXKdZHweef6y0B67V",
    "Bj9UqZbhQsanLzgalpEG",
    "dXtC3XhB9GtPusIpNtQx",
    "G17SuINrv2H9FC6nvetn",
    "goT3UYdM9bhm0n2lmKQx",
    "pBZVCk298iJlHAcHQwLr",
    "BL7YSL1bAkmW8U0JnU8o",
    "HDA9tsk27wYi3uq0fPcK",
    "L0Dsvb3SLTyegXwtm47J",
    "tnSpp4vdxKPjI9w0GnoV",
    "UgBBYS2sOqTuMpoF3BR0",
    "1hlpeD1ydbI2ow0Tt3EW",
    "kdmDKE6EkgrWrrykO9Qt",
    "rJ4KGss9TSKfyhkSuCRh",
    "MGnihriF5kUNUiVoIdz1",
    "omRordDZNt4Gy45cetUa",
    "56AoDkrOh6qfVPDXZ7Pt",
    "ZF6FPAbjXT4488VcRRnw",
    "iMHt6G42evkXunaDU065"
  ];

  const voice = voiceArrs[Math.floor(Math.random() * voiceArrs.length)];

  try {
    const { name, instructions } = await req.json();
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!name || !instructions) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const vapiAgent = await vapi.assistants.create({
      name,
      firstMessageMode: "assistant-speaks-first-with-model-generated-message",
      model: {
        provider: "openai",
        model: "gpt-4.1",
        temperature: 0.7,
        messages: [{
          role: "system",
          content: `Please first greet the user and then ask them to provide their name, you should follow these instructions: "${instructions}" but you have to be as natural as possible and speak in a human way, avoid saying formatting terms outloud and just speak as if you were a real human, avoid saying anything that might be considered offensive or inappropriate.`,
        }]
      },
      voice: {
        provider: "11labs",
        voiceId: voice,
      },
    });

    const agent = await prismadb.agent.create({
      data: {
        name,
        instructions,
        userId: session.user.id,
        vapiAgent: vapiAgent.id,
      }
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.log("ERROR_CREATING_AGENT: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
