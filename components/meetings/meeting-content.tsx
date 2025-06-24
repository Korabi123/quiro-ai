"use client";

import { Video, XCircle } from "lucide-react";
import { MeetingEmptySvg } from "../svg/meeting-empty";
import { Button } from "../ui/button";
import { useMeeting } from "@/lib/meetings";
import { useTransition } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

interface Props {
  meetingId: string;
}

export const MeetingContent = ({  meetingId }: Props) => {
  const { data: meeting } = useMeeting(meetingId);

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onMeetingCancel = () => {
    startTransition(async () => {
      toast.promise(axios.patch(`/api/meetings/cancel?id=${meetingId}`), {
        loading: "Cancelling meeting...",
        success: () => {
            router.push("/meetings");
            return "Meeting cancelled successfully";
          },
        error: "Something went wrong",
      });
    })
  }


  return (
    <>
      {!meeting?.vapiCallId || meeting?.callTranscript === null && (
        <div className="mt-14 py-4 flex items-center justify-center rounded-2xl border border-border/50 bg-muted-foreground/5">
          <div className="flex flex-col gap-2">
            <MeetingEmptySvg />
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center font-medium text-xl">Not started yet</p>
              <p className="text-center text-sm text-muted-foreground/70">
                Once you start this meeting, a summary will appear here.
              </p>
              <div className="inline-flex items-center gap-2">
                <Button
                  disabled={isPending}
                  onClick={onMeetingCancel}
                  variant={"outline"}
                >
                  <XCircle className="size-5" />
                  Cancel meeting
                </Button>
                <Button
                  disabled={isPending}
                  onClick={() => router.push(`/meetings/${meetingId}/call`)}
                  className="bg-[#ea721b] hover:bg-opacity-80 transition-all"
                >
                  <Video className="size-5" />
                  Start meeting
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {meeting?.vapiCallId && meeting?.callTranscript && <div>hi</div>}
    </>
  );
};
