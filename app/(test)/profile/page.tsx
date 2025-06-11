"use client";

import { UserButton } from "@/components/auth/user-button";
import { MultiStepModal, MultiStepModalContent } from "@/components/luxe/multi-step-modal";
import { ConfettiSideCannons } from "@/components/magicui/confetti-side";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

const ProfilePage = () => {
  const { data } = authClient.useSession();
  const [open, setOpen] = useState(true);

  if (!data) {
    return (
      <Skeleton className="size-[44px] border-black/60 rounded-full" />
    );
  }

  const steps = [
    { title: "Congratulations! You just joined quiro Pro", description: "Click continue to see your benifits" },
    { title: "Unlimited Agents, Calls & Transcripts", description: "You now have the ability to create unlimited agents and have unlimited chats, calls and transcripts with each agent" },
    { title: "Call recording", description: "You can now record your calls with each agent" },
    { title: "Skill Evaluation", description: "You can now evaluate your skills and get instant feedback on your abilities" },
    { title: "Tailored Tips", description: "You can now get tailored tips on how to improve your hireability" },
    { title: "Daily Problems", description: "You now get daily coding problems to solve to improve your coding skills" },
  ];

  const upgradedParam = new URLSearchParams(window.location.search).get("upgraded");

  if (upgradedParam === "true") {
    return (
      <>
        {/* @ts-ignore */}
        <UserButton user={data?.user} session={data?.session} />
        <MultiStepModal open={open} onOpenChange={() => {
          setOpen(open => !open);
        }}>
          <MultiStepModalContent bgOpacity={40} steps={steps} />
        </MultiStepModal>
        <ConfettiSideCannons />
      </>
    );
  }

  return (
    // @ts-ignore
    <UserButton user={data?.user} session={data?.session} />
  );
}

export default ProfilePage;
