import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Meeting } from "@prisma/client";

export const useMeetings = () => {
  const queryString = "";

  const { data, error, isLoading } = useSWR<Meeting[]>(
    `/api/meetings/get${queryString}`,
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading,
  };
};

export const useMeeting = (meetingId: string) => {
  const { data, error, isLoading } = useSWR<Meeting>(
    `/api/meetings/get?id=${meetingId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading,
  };
};
