"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  RADAR_DOMAIN,
  toRadarData,
  type GradePayload,
} from "@/lib/grading/types";

/**
 * Radar of the five category scores.
 *
 * Five axes is the practical maximum before the axis labels start colliding on
 * narrow viewports, which is exactly the number of grading categories.
 */
export const CategoryRadar = ({
  payload,
  className,
}: {
  payload: GradePayload;
  className?: string;
}) => {
  const data = toRadarData(payload);
  const average = Math.round(
    data.reduce((sum, point) => sum + point.score, 0) / data.length
  );

  return (
    <div
      className={cn(
        "bg-muted-foreground/5 p-5 rounded-2xl border border-border/50 flex flex-col",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Category breakdown</h3>
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
          Avg {average}
        </span>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#e5e5e5" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 10, fill: "#737373" }}
            />
            <PolarRadiusAxis
              domain={RADAR_DOMAIN}
              tick={{ fontSize: 9, fill: "#a3a3a3" }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              dataKey="score"
              stroke="#ea721b"
              fill="#ea721b"
              fillOpacity={0.28}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e5e5e5",
                fontSize: 12,
              }}
              formatter={(value: number | string) => [`${value} / 100`, "Score"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};