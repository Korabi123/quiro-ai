import { MeetingHeading } from "@/components/meetings/heading";
import { MeetingContent } from "@/components/meetings/meeting-content";
import prismadb from "@/lib/prismadb";
import { notFound } from "next/navigation";

const MeetingByIdPage = async ({ params }: { params: Promise<{ meetingId: string }> }) => {
  const { meetingId } = await params;

  const meetingDB = await prismadb.meeting.findUnique({
    where: {
      id: meetingId,
    },
  });

  if (!meetingDB) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 md:px-10 px-4 py-4">
      <MeetingHeading meetingId={meetingDB.id} secondary breadcrumb={meetingDB.title} breadcrumbHref={meetingDB.id} />
      <MeetingContent meetingId={meetingDB.id} />
    </div>
  );
}

export default MeetingByIdPage;
