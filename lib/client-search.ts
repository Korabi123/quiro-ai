import type { Agent } from "@prisma/client";
import type { Meeting } from "@prisma/client";
import type { Report } from "@prisma/client";

export function searchItems<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  filters?: Record<string, any>
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

      if (key.includes('Date') && typeof value === 'object' && (value.from || value.to)) {
        const itemDate = new Date(itemValue as string);
        const fromDate = value.from ? new Date(value.from) : null;
        const toDate = value.to ? new Date(value.to) : null;

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
  meetings: Meeting[],
  searchTerm: string,
  filters?: {
    status?: string;
    date?: { from?: string; to?: string };
    agent?: string;
  }
): Meeting[] {
  if (filters?.agent) {
    const searchFiltered = searchItems<Meeting>(
      meetings,
      searchTerm,
      ['title', 'status'],
      Object.fromEntries(Object.entries(filters).filter(([key]) => key !== 'agent'))
    );

    return searchFiltered.filter(meeting =>
      // @ts-expect-error - We know agent has a name property
      meeting.agent?.name === filters.agent
    );
  }

  return searchItems<Meeting>(
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
