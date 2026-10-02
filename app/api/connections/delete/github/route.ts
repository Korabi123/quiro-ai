import { auth } from "@/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { count } = await prismadb.account.deleteMany({
      where: {
        providerId: "github",
        userId: session.user.id,
      },
    });

    if (count === 0) {
      return new NextResponse("Connection not found", { status: 404 });
    }

    return NextResponse.json({ message: "Connection deleted successfully" });
  } catch (error) {
    console.log("ERROR_DELETING_CONNECTION: ", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}