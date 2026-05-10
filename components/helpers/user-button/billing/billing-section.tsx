import { User } from "@prisma/client";
import { SubscriptionSection } from "./subscripton-section";

interface Props {
  className?: string;
  user: User;
}

export const BillingSection = ({ className, user }: Props) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <SubscriptionSection user={user} />
    </div>
  );
}
