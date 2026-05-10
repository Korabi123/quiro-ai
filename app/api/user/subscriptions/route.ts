import prisma from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userIds } = await req.json();
    
    if (!userIds || !Array.isArray(userIds)) {
      return new NextResponse("Invalid userIds", { status: 400 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        referenceId: { in: userIds },
        status: "active"
      }
    });

    const subscriptionMap = subscriptions.reduce((acc: any, sub) => {
      acc[sub.referenceId] = sub;
      return acc;
    }, {});

    return NextResponse.json(subscriptionMap);
  } catch (error) {
    console.error("[SUBSCRIPTIONS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
