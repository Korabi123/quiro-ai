"use client";

import { useModalStore } from "@/hooks/use-modal-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  ChevronsLeftRight,
  GalleryVerticalEnd,
  Megaphone,
  StarIcon,
  Video,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { authClient } from "@/lib/auth-client";
import { AFTER_LOGIN } from "@/routes";
import { toast } from "sonner";

export const RestrictionDialog = () => {
  const { isOpen, type, data, onClose } = useModalStore();
  const isDialogOpen = isOpen && type === "restrictionDialog";

  return (
    <Dialog open={isDialogOpen} onOpenChange={() => onClose()}>
      <DialogContent className="md:w-[550px] w-full">
        <DialogHeader>
          <DialogTitle>
            Upgrade to quiro{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] pr-[1px]">
              Pro
            </span>
          </DialogTitle>
          <DialogDescription>
            {data.restrictionDialogData?.dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="bg-muted flex items-center gap-4 w-full rounded-xl p-3 text-white">
            <div className="rounded-lg bg-[#ffd43e]/80 w-10 h-10 inline-flex items-center justify-center">
              <Video className="size-5" />
            </div>
            <p className="text-md text-black">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] pr-[1px]">
                Unlimited
              </span>{" "}
              Meetings
            </p>
          </div>

          <div className="bg-muted flex items-center gap-4 w-full rounded-xl p-3 text-white">
            <div className="rounded-lg bg-[#ffd43e]/80 w-10 h-10 inline-flex items-center justify-center">
              <GalleryVerticalEnd className="size-5" />
            </div>
            <p className="text-md text-black">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] pr-[1px]">
                Skill reports
              </span>
            </p>
          </div>

          <div className="bg-muted flex items-center gap-4 w-full rounded-xl p-3 text-white">
            <div className="rounded-lg bg-[#ffd43e]/80 w-10 h-10 inline-flex items-center justify-center">
              <Megaphone className="size-5" />
            </div>
            <p className="text-md text-black">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] pr-[1px]">
                24/7 customer support
              </span>
            </p>
          </div>

          <div className="bg-muted flex items-center gap-4 w-full rounded-xl p-3 text-white">
            <div className="rounded-lg bg-[#ffd43e]/80 w-10 h-10 inline-flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-heart-plus-icon lucide-heart-plus"
              >
                <path d="m14.479 19.374-.971.939a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5a5.2 5.2 0 0 1-.219 1.49" />
                <path d="M15 15h6" />
                <path d="M18 12v6" />
              </svg>
            </div>
            <p className="text-md text-black">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] pr-[1px]">
                Help development of quiro
              </span>
            </p>
          </div>

          <div className="bg-muted flex items-center gap-4 w-full rounded-xl p-3 text-white">
            <div className="rounded-lg bg-[#ffd43e]/80 w-10 h-10 inline-flex items-center justify-center">
              <ChevronsLeftRight className="size-5" />
            </div>
            <p className="text-md text-black">
              <span className="inline-flex items-center gap-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] pr-[1px]">
                  Coding problems
                </span>
                <Badge className="ml-auto text-xs font-medium bg-[#ffd43e] hover:bg-[#ffd43e]/80">
                  Coming Soon
                </Badge>
              </span>
            </p>
          </div>

          <div className="bg-muted flex items-center gap-4 w-full rounded-xl p-3 text-white">
            <div className="rounded-lg bg-[#ffd43e]/80 w-10 h-10 inline-flex items-center justify-center">
              <StarIcon className="size-5" />
            </div>
            <p className="text-md text-black">
              <span className="inline-flex items-center gap-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] pr-[1px]">
                  Tailored tips
                </span>
                <Badge className="ml-auto text-xs font-medium bg-[#ffd43e] hover:bg-[#ffd43e]/80">
                  Coming Soon
                </Badge>
              </span>
            </p>
          </div>

          <Button
            className="w-full mt-3 bg-[#2f2722]/90 hover:bg-opacity-80 transition-all"
            effect={"shineHover"}
            onClick={async () => {
              await authClient.subscription.upgrade(
                {
                  plan: "pro",
                  successUrl: `${AFTER_LOGIN}?upgraded=true`,
                  cancelUrl: `${AFTER_LOGIN}`,
                },
                {
                  onError: (ctx) => {
                    toast.error(ctx.error.message);
                  },
                }
              );
            }}
          >
            Upgrade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
