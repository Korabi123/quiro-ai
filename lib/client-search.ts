import type { Agent } from "@prisma/client";
import type { Meeting } from "@prisma/client";
import type { Report } from "@prisma/client";

// Generic search function that can be used for any data type
export function searchItems<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  filters?: Record<string, any>
): T[] {
  if (!items || items.length === 0) return [];

  // If no search term and no filters, return all items
  if (!searchTerm && (!filters || Object.keys(filters).length === 0)) {
    return items;
  }

  return items.filter((item) => {
    // Apply search term filtering
    const matchesSearchTerm = !searchTerm || searchFields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;

      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Apply additional filters if provided
    const matchesFilters = !filters || Object.entries(filters).every(([key, value]) => {
      // Skip empty filter values
      if (value === undefined || value === null || value === '') return true;

      const itemValue = item[key as keyof T];

      // Handle array values (for multi-select filters)
      if (Array.isArray(value)) {
        return value.length === 0 || value.includes(itemValue);
      }

      // Handle date ranges
      if (key.includes('Date') && typeof value === 'object' && (value.from || value.to)) {
        const itemDate = new Date(itemValue as string);
        const fromDate = value.from ? new Date(value.from) : null;
        const toDate = value.to ? new Date(value.to) : null;

        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
      }

      // Handle specific type filter for reports
      if (key === 'type' && itemValue !== value) {
        return false;
      }

      return itemValue === value;
    });

    return matchesSearchTerm && matchesFilters;
  });
}

// Specific search functions for each data type
export function searchMeetings(
  meetings: Meeting[],
  searchTerm: string,
  filters?: {
    status?: string;
    date?: { from?: string; to?: string };
    agent?: string;
    // Add other meeting-specific filters here
  }
): Meeting[] {
  // If agent filter is present, we need special handling
  if (filters?.agent) {
    // First filter by search term and other filters
    const searchFiltered = searchItems<Meeting>(
      meetings,
      searchTerm,
      ['title', 'status'],
      // Exclude agent from filters for now
      Object.fromEntries(Object.entries(filters).filter(([key]) => key !== 'agent'))
    );

    // Then manually filter by agent name
    return searchFiltered.filter(meeting =>
      // @ts-expect-error - We know agent has a name property
      meeting.agent?.name === filters.agent
    );
  }

  // If no agent filter, use the standard search
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
    // Add other agent-specific filters here
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
    // Add other report-specific filters here
  }
): Report[] {
  // Create a mutable copy of filters
  const currentFilters = { ...filters };



  return searchItems<Report>(
    reports,
    searchTerm,
    ['name', 'type', 'customType'],
    currentFilters
  );
}
