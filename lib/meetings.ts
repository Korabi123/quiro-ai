import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Prisma } from "@prisma/client";

/**
 * `/api/meetings/get` always selects the agent, chats and user relations, so the
 * client types have to include them. Typing the hooks with a bare `Meeting`
 * made every `meeting.agent` access a type error that callers had to silence.
 */
const meetingInclude = {
  agent: true,
  chats: true,
  user: true,
} satisfies Prisma.MeetingInclude;

export type MeetingWithRelations = Prisma.MeetingGetPayload<{
  include: typeof meetingInclude;
}>;

export const useMeetings = () => {
  const queryString = "";

  const { data, error, isLoading } = useSWR<MeetingWithRelations[]>(
    `/api/meetings/get${queryString}`,
    fetcher,
    {
      refreshInterval: 0,
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
  const { data, error, isLoading } = useSWR<MeetingWithRelations>(
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
