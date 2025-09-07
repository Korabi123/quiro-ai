import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Chat } from "@prisma/client";

export const useChats = (meetingId?: string, reportId?: string) => {
  const { data, error, isLoading } = useSWR<Chat[]>(
    `/api/chats/get?meetingId=${meetingId}&reportId=${reportId}`,
    fetcher,
    {
      refreshInterval: 150
    }
  );

  return {
    data,
    error,
    isLoading,
  };
};
