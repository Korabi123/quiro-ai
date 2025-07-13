"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { useTransition } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export const DeleteMeetingDialog = () => {
  const { isOpen, type, data: meetingData } = useModalStore();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isModalOpen = isOpen && type === "deleteMeeting";

  const onSubmit = () => {
    startTransition(async () => {
      try {
        await axios
          .delete(
            `/api/meetings/delete?meetingId=${meetingData.meetingId}`
          )
          .finally(() => {
            toast.success("Meeting deleted successfully");
            useModalStore.getState().onClose();
            router.push("/meetings");
          });
      } catch (error) {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={() => {
        useModalStore.getState().onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Meeting</DialogTitle>
          <DialogDescription>Are you sure you want to delete this meeting? This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="ml-auto mt-2 gap-2 flex md:flex-row flex-col w-full">
          <DialogClose asChild>
            <Button
              variant={"outline"}
              type="button"
              className="md:max-w-fit w-full"
              disabled={isPending}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="md:max-w-fit w-full bg-destructive hover:bg-destructive/80 transition-all"
            disabled={isPending}
            onClick={() => onSubmit()}
          >
            <Loader2
              className={cn(
                "text-transparent -mr-6 size-5 transition-all",
                isPending && "mr-0 animate-spin text-white transition-all"
              )}
            />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
