import useSWR from "swr";
import type { Subscription } from "@better-auth/stripe";

import { authClient } from "@/lib/auth-client";

type SubscriptionListResponse = {
  data?: Subscription[];
};

const SUBSCRIPTION_CACHE_KEY = "auth:subscription:current";

const subscriptionFetcher = async (): Promise<Subscription | null> => {
  const response = (await authClient.subscription.list()) as SubscriptionListResponse;
  return response?.data?.[0] ?? null;
};

export const useSubscription = () => {
  return useSWR<Subscription | null>(SUBSCRIPTION_CACHE_KEY, subscriptionFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    dedupingInterval: 60_000,
  });
};
