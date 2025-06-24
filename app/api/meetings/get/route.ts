import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const agentParam = searchParams.get("agent");

    const idParam = searchParams.get("id");

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!idParam) {
      const where: any = {
        AND: [{ userId: session.user.id }],
      };

      if (agentParam) {
        const agent = await prismadb.agent.findFirst({
          where: {
            userId: session.user.id,
            name: agentParam,
          },
        });

        if (agent) {
          where.AND.push({ agentId: agent.id });
        } else {
          return NextResponse.json([]);
        }
      }

      if (status) {
        // @ts-ignore
        where.AND.push({ status: status.toUpperCase() });
      }

      if (search) {
        const searchConditions: any[] = [
          {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];

        // Only search agent name if no specific agent is selected
        if (!agentParam) {
          searchConditions.push({
            agent: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          });
        }
        where.AND.push({ OR: searchConditions });
      }

      const meetings = await prismadb.meeting.findMany({
        where,
        include: {
          agent: true,
          chats: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return NextResponse.json(meetings);
    } else {
      const meeting = await prismadb.meeting.findFirst({
        where: {
          id: idParam,
          userId: session.user.id,
        },
        include: {
          agent: true,
          chats: true,
          user: true,
        },
      });
      return NextResponse.json(meeting);
    }
  } catch (error) {
    console.log("ERROR_GETTING_MEETINGS: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
