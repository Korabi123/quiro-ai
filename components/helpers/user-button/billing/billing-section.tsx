import { User } from "@prisma/client";
import { SubscriptionSection } from "./subscripton-section";

interface Props {
  className?: string;
  user: User;
}

export const BillingSection = ({ className, user }: Props) => {
  return (
    <div className="flex md:flex-row flex-col md:gap-0 gap-8 py-3 w-full">
      <p className="text-sm font-medium pointer-events-none">Billing</p>
      <div className="flex w-full md:items-end flex-col ml-3 gap-10">
        <SubscriptionSection user={user} />
      </div>
    </div>
  );
}
