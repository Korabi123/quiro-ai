"use client";

import { StreakSuccessDialog } from "@/components/dialogs/streak-success-dialog";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useMeeting } from "@/lib/meetings";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Vapi from "@vapi-ai/web";
import axios from "axios";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  meetingId: string;
  apiKey: string;
  assistantId: string;
}

import { mutate } from "swr";

export const Wrapper = ({  meetingId, apiKey, assistantId }: Props) => {
  const [animate] = useAutoAnimate();

  const router = useRouter();

  const session = authClient.useSession();
  const { data: meeting, isLoading } = useMeeting(meetingId);

  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{role: string, text: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showStreakDialog, setShowStreakDialog] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    const vapiInstance = new Vapi(apiKey);
    setVapi(vapiInstance);

    vapiInstance.on('call-start', () => {
      console.log('Call started');
      setIsConnected(true);
    });

    vapiInstance.on('call-end', async () => {
      console.log('Call ended');
      setIsConnected(false);
      setIsSpeaking(false);

      toast.promise(axios.patch(`/api/meetings/update?meetingId=${meetingId}&vapiAgent=${assistantId}`), {
        loading: "Ending meeting...",
        success: () => {
          setTimeout(() => {
            axios.patch(`/api/meetings/details?meetingId=${meetingId}&vapiAgent=${assistantId}`)
              .then(async () => {
                await mutate("/api/user/streak");
                try {
                  const { data: streakData } = await axios.get("/api/user/streak");
                  if (streakData && streakData.streak > 0) {
                    setStreakCount(streakData.streak);
                    setShowStreakDialog(true);
                  } else {
                    router.push("/meetings");
                  }
                } catch {
                  router.push("/meetings");
                }
              });
          }, 2500);

          return "Meeting ended successfully";
        },
        error: () => {
          return "Something went wrong";
        },
      })
    });

    vapiInstance.on('speech-start', () => {
      console.log('Assistant started speaking');
      setIsSpeaking(true);
    });

    vapiInstance.on('speech-end', () => {
      console.log('Assistant stopped speaking');
      setIsSpeaking(false);
    });

    vapiInstance.on('message', (message) => {
      if (message.type === 'transcript') {
        setTranscript(prev => [...prev, {
          role: message.role,
          text: message.transcript
        }]);
      }
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
    });

    return () => {
      vapiInstance?.stop();
    };
  }, [apiKey]);

  const startCall = () => {
    if (vapi) {
      toast.promise(vapi.start(assistantId), {
        loading: "Starting meeting...",
        success: () => {
          setIsSubmitting(false);
          return "Meeting started successfully";
        },
        error: (error) => {
          setIsSubmitting(false);
          return error.message || "Something went wrong";
        },
      });
    }
  }

  const stopCall = () => {
    if (vapi) {
      vapi?.stop();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full p-5">
        <Loader className="size-6 animate-spin text-muted-foreground/70" />
      </div>
    )
  }

  return (
    <div
      ref={animate}
      className="flex flex-col justify-center gap-5 items-cetermt-14 p-5 md:px-60 rounded-2xl border border-border/50"
    >
      <div className="relative md:min-h-[200px] flex items-center justify-center p-5 rounded-2xl border border-border/50 bg-[#ffd43e]/10">
        <Avatar className="size-16">
          <AvatarImage src={session.data?.user.image!} />
        </Avatar>
        <div className="absolute p-1 px-3 bg-[#ea721b]/60 rounded-bl-2xl rounded-tr-2xl bottom-0 left-0">
          <p className="text-sm text-white">{session.data?.user.name}</p>
        </div>
      </div>
      <div ref={animate}>
        {isConnected && (
          <div
            ref={animate}
            className={cn(
              "relative md:min-h-[200px] flex items-center justify-center p-5 rounded-2xl border border-border/50 bg-[#ffd43e]/10",
              isSpeaking &&
                "ring-2 ring-offset-[2.5px] ring-[#ea721b]/50 rounded-bl-[20px]"
            )}
          >
            {/* @ts-ignore */}
            <GeneratedAvatar className="size-16" seed={meeting?.agent?.name} />
            <div className="absolute p-1 px-3 bg-[#ea721b]/60 rounded-bl-2xl rounded-tr-2xl bottom-0 left-0">
              <p className="text-sm text-white">
                {/* @ts-ignore */}
                {meeting?.agent?.name}
              </p>
            </div>
          </div>
        )}
      </div>
      {!isConnected && (
        <Button
          onClick={() => startCall()}
          className="bg-[#392822] max-w-fit hover:bg-opacity-80 transition-all"
        >
          Start Meeting
        </Button>
      )}
      {isConnected && (
        <Button
          onClick={() => stopCall()}
          variant={"destructive"}
          className="max-w-fit"
        >
          End Meeting
        </Button>
      )}
      <StreakSuccessDialog
        isOpen={showStreakDialog}
        streak={streakCount}
        onClose={() => router.push("/meetings")}
      />
    </div>
  );
}
