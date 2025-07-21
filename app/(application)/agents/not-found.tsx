"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="text-black w-full bg-white flex flex-col items-center justify-center mt-[25%] gap-4">
      <div className="flex items-center justify-center gap-4">
        <h1 className="font-medium">404</h1>
        <p className="text-2xl font-medium tracking-tighter">
          Agent not found
        </p>
      </div>
      <Button
        onClick={() => router.push("/agents")}
        size={"sm"}
        className="text-sm"
      >
        Back to Agents
      </Button>
    </div>
  );
}
