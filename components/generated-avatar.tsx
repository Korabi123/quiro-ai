import { createAvatar } from "@dicebear/core";
import { botttsNeutral, initials } from "@dicebear/collection";
import { memo, useMemo } from "react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  seed: string;
  className?: string;
  variant?: "initials" | "bottts";
}

export const GeneratedAvatar = memo(({ seed, className, variant = "bottts" }: Props) => {
  const avatarDataUri = useMemo(() => {
    if (variant === "bottts") {
      const avatar = createAvatar(botttsNeutral, { seed });
      return avatar.toDataUri();
    } else {
      const avatar = createAvatar(initials, {
        seed,
        fontWeight: 500,
        fontSize: 42,
      });
      return avatar.toDataUri();
    }
  }, [seed, variant]);

  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={avatarDataUri} alt="Avatar" />
      <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
});

GeneratedAvatar.displayName = "GeneratedAvatar";
