import type { Agent, Meeting, Prisma } from "@prisma/client";
import type { Report } from "@prisma/client";

type MeetingWithAgent = Prisma.MeetingGetPayload<{
  include: { agent: true };
}>;

/**
 * The filter values this helper understands. Callers pass strings, a list of
 * accepted values, or a date range; `undefined`/`null` mean "do not filter".
 */
type FilterValue =
  | string
  | ReadonlyArray<unknown>
  | { from?: string; to?: string }
  | undefined
  | null;

/** Narrows a filter value to a date range without trusting `typeof`. */
function isDateRange(
  value: FilterValue
): value is { from?: string; to?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    ("from" in value || "to" in value)
  );
}

export function searchItems<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  filters?: Record<string, FilterValue>
): T[] {
  if (!items || items.length === 0) return [];

  if (!searchTerm && (!filters || Object.keys(filters).length === 0)) {
    return items;
  }

  return items.filter((item) => {
    const matchesSearchTerm = !searchTerm || searchFields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;

      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });

    const matchesFilters = !filters || Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true;

      const itemValue = item[key as keyof T];

      if (Array.isArray(value)) {
        return value.length === 0 || value.includes(itemValue);
      }

      const range = isDateRange(value) ? value : undefined;

      if (key.includes('Date') && range && (range.from || range.to)) {
        const itemDate = new Date(itemValue as string);
        const fromDate = range.from ? new Date(range.from) : null;
        const toDate = range.to ? new Date(range.to) : null;

        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
      }

      if (key === 'type' && itemValue !== value) {
        return false;
      }

      return itemValue === value;
    });

    return matchesSearchTerm && matchesFilters;
  });
}

export function searchMeetings(
  meetings: MeetingWithAgent[],
  searchTerm: string,
  filters?: {
    status?: string;
    date?: { from?: string; to?: string };
    agent?: string;
  }
): MeetingWithAgent[] {
  if (filters?.agent) {
    const searchFiltered = searchItems<MeetingWithAgent>(
      meetings,
      searchTerm,
      ['title', 'status'],
      Object.fromEntries(Object.entries(filters).filter(([key]) => key !== 'agent'))
    );

    return searchFiltered.filter(
      (meeting) => meeting.agent?.name === filters.agent
    );
  }

  return searchItems<MeetingWithAgent>(
    meetings,
    searchTerm,
    ['title', 'status'],
    filters
  );
}

export function searchAgents(
  agents: Agent[],
  searchTerm: string,
  filters?: {
    type?: string;
  }
): Agent[] {
  return searchItems<Agent>(
    agents,
    searchTerm,
    ['name'],
    filters
  );
}

export function searchReports(
  reports: Report[],
  searchTerm: string,
  filters?: {
    type?: string;
  }
): Report[] {
  const currentFilters = { ...filters };



  return searchItems<Report>(
    reports,
    searchTerm,
    ['name', 'type', 'customType'],
    currentFilters
  );
}
