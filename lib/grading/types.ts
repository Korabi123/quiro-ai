import { CATEGORIES } from "@/lib/grading/schema";
import type {
  Finding,
  GradePayload,
  GradingCategory,
  Synthesis,
  Understanding,
} from "@/lib/grading/schema";

/**
 * Client-safe presentation helpers for a grade payload. Kept separate from
 * `@/lib/grading/schema` so components can import styling concerns without
 * pulling in the validation layer.
 */

export type { Finding, GradePayload, GradingCategory, Synthesis, Understanding };

export const scoreBadgeClass = (score: number): string => {
  if (score < 50) return "bg-red-400/20 border-red-400/50 text-red-500";
  if (score < 75) return "bg-yellow-400/20 border-yellow-400/50 text-yellow-500";
  return "bg-green-400/20 border-green-400/50 text-green-500";
};

export const scoreTextClass = (score: number): string => {
  if (score < 50) return "text-red-500";
  if (score < 75) return "text-yellow-500";
  return "text-green-500";
};

/** Accent bar colour used by the per-category meters. */
export const scoreBarClass = (score: number): string => {
  if (score < 50) return "bg-red-500";
  if (score < 70) return "bg-yellow-500";
  if (score < 85) return "bg-blue-500";
  return "bg-green-500";
};

export const severityMeta: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  HIGH: {
    label: "High",
    className: "bg-red-400/20 border-red-400/50 text-red-500",
    dot: "bg-red-500",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-orange-400/20 border-orange-400/50 text-orange-600",
    dot: "bg-orange-500",
  },
  LOW: {
    label: "Low",
    className: "bg-yellow-400/20 border-yellow-400/50 text-yellow-600",
    dot: "bg-yellow-500",
  },
  INFO: {
    label: "Info",
    className: "bg-blue-400/20 border-blue-400/50 text-blue-600",
    dot: "bg-blue-500",
  },
};

export const SEVERITY_ORDER: Record<string, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  INFO: 3,
};

export const RADAR_COLORS: Record<GradingCategory, string> = {
  code_quality: "#ea721b",
  architecture: "#ffd43e",
  testing: "#3b82f6",
  documentation: "#8b5cf6",
  maintainability: "#10b981",
};

export type RadarDatum = {
  category: string;
  score: number;
  fill: string;
};

export const toRadarData = (payload: GradePayload): RadarDatum[] =>
  CATEGORIES.map((key) => {
    const entry = payload.categories.find((item) => item.key === key);
    return {
      category: entry?.label ?? key,
      score: entry?.score ?? 0,
      fill: RADAR_COLORS[key],
    };
  });

export const RADAR_DOMAIN: [number, number] = [0, 100];

/**
 * Sentinel error text written by the cancel endpoint.
 *
 * A running Inngest step cannot be interrupted mid-execution, so cancelling
 * marks the row FAILED with this text. The worker checks for it on every
 * progress tick and again before persisting, which is what actually stops the
 * job - without those checks the pipeline would keep spending tokens and then
 * overwrite the cancelled row as COMPLETED.
 *
 * Defined here rather than in `@/lib/inngest/client` because this module is
 * imported by client components, and that file pulls in the Inngest SDK.
 * `lib/inngest/client.ts` re-exports it so server call sites keep one name.
 */
export const RUN_CANCELLED_ERROR = "Cancelled by user";

export const sortBySeverity = <T extends { severity: string }>(
  findings: T[]
): T[] =>
  [...findings].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );

/** Human-readable relative age, matching the pattern used in the reports table. */
export const formatRelativeDate = (value: string | Date): string => {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
};