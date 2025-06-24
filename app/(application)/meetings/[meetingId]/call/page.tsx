import prismadb from "@/lib/prismadb";
import { Wrapper } from "./wrapper";
import { notFound } from "next/navigation";
import { MeetingHeading } from "@/components/meetings/heading";

const CallPAGE = async ({ params }: { params: Promise<{ meetingId: string }> }) => {
  const { meetingId } = await params;

  const meetingDB = await prismadb.meeting.findUnique({
    where: {
      id: meetingId,
    },
    include: {
      agent: true,
    }
  });

  if (!meetingDB) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
      <MeetingHeading
        optionsHidden
        secondary
        breadcrumb={meetingDB.title}
        breadcrumbHref={meetingDB.id}
      />
      <Wrapper
        meetingId={meetingId}
        apiKey={process.env.NEXT_PUBLIC_VAPI_KEY!}
        assistantId={meetingDB.agent.vapiAgent!}
      />
    </div>
  );
}

export default CallPAGE;
