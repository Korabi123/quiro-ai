import useSWR from "swr";
import { fetcher } from "./fetcher";
import { Meeting } from "@prisma/client";

interface Props {
  search?: string | null;
  status?: string | null;
  agent?: string | null;
}

export const useMeetings = ({ search, status, agent }: Props) => {
  const queryParams = [];

  if (search) {
    queryParams.push(`search=${search}`);
  }
  if (status) {
    queryParams.push(`status=${status}`);
  }
  if (agent) {
    queryParams.push(`agent=${agent}`);
  }

  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

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
