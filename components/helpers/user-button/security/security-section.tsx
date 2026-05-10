import { User } from "@prisma/client";
import { PasswordSection } from "./password-section";
import { TwoFactorSection } from "./two-factor-section";
import { PasskeySection } from "./passkey-section";
import { SessionsSection } from "./sessions-section";

export const SecuritySection = ({
  user,
}: {
  user: User;
}) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <PasswordSection />
      <TwoFactorSection user={user} />
      <PasskeySection />
      <SessionsSection user={user} />
    </div>
  );
}
