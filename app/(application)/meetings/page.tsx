"use client";

import { GeneratedAvatar } from "@/components/generated-avatar";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const MeetingsPage = () => {
  const [value, setValue] = useState("");

  return (
    <div className="flex items-center gap-3">
      <GeneratedAvatar seed={value} />
      <Input className="w-[200px] font-medium" value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
}

export default MeetingsPage;
