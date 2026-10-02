import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { MeetingStatus, Prisma } from "@prisma/client";

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
      const and: Prisma.MeetingWhereInput[] = [{ userId: session.user.id }];

      if (agentParam) {
        const agent = await prismadb.agent.findFirst({
          where: {
            userId: session.user.id,
            name: agentParam,
          },
        });

        if (agent) {
          and.push({ agentId: agent.id });
        } else {
          return NextResponse.json([]);
        }
      }

      if (status) {
        //* The query string carries a lowercase status; the column is an enum.
        //* An unrecognised value would throw at runtime, so validate it.
        const normalizedStatus = status.toUpperCase() as MeetingStatus;

        if (Object.values(MeetingStatus).includes(normalizedStatus)) {
          and.push({ status: normalizedStatus });
        }
      }

      if (search) {
        const or: Prisma.MeetingWhereInput[] = [
          {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];

        if (!agentParam) {
          or.push({
            agent: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          });
        }
        and.push({ OR: or });
      }

      const meetings = await prismadb.meeting.findMany({
        where: { AND: and },
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
