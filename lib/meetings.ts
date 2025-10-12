import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Meeting } from "@prisma/client";

export const useMeetings = () => {
  const queryString = "";

  const { data, error, isLoading } = useSWR<Meeting[]>(
    `/api/meetings/get${queryString}`,
    fetcher,
    {
      refreshInterval: 2500
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
    fetcher
  );

  return {
    data,
    error,
    isLoading,
  };
};
