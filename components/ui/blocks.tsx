"use client";

import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export type ActiveDivsMap = Record<number, Set<number>>;

export interface BlocksProps {
  activeDivs?: ActiveDivsMap;
  activeDivsClass?: string;
  divClass?: string;
  classname?: string;
  containerRef: React.RefObject<HTMLElement | null>;
}

export default function Blocks({
  activeDivs,
  activeDivsClass,
  divClass,
  classname,
  containerRef,
}: BlocksProps) {
  const [dims, setDims] = useState({ cols: 18, rows: 12 });
  const [pointer, setPointer] = useState<{ col: number; row: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const { clientWidth, clientHeight } = el;
      const approxCell = 52;
      const cols = Math.max(12, Math.floor(clientWidth / approxCell));
      const rows = Math.max(8, Math.floor(clientHeight / approxCell));
      setDims({ cols, rows });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  const cells = useMemo(() => {
    const out: { key: string; col: number; row: number }[] = [];
    for (let row = 0; row < dims.rows; row++) {
      for (let col = 0; col < dims.cols; col++) {
        out.push({ key: `${col}-${row}`, col, row });
      }
    }
    return out;
  }, [dims.cols, dims.rows]);

  const isLit = useCallback(
    (col: number, row: number) => {
      const preset = activeDivs?.[col]?.has(row) ?? false;
      if (!pointer) return preset;

      const dc = Math.abs(col - pointer.col);
      const dr = Math.abs(row - pointer.row);
      const near = dc <= 2 && dr <= 2;

      return preset || near;
    },
    [activeDivs, pointer]
  );

  return (
    <div
      className={cn("pointer-events-auto absolute inset-0 z-0", classname)}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${dims.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${dims.rows}, minmax(0, 1fr))`,
      }}
      onMouseMove={(e) => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const col = Math.floor(((e.clientX - rect.left) / rect.width) * dims.cols);
        const row = Math.floor(((e.clientY - rect.top) / rect.height) * dims.rows);
        setPointer({
          col: Math.min(dims.cols - 1, Math.max(0, col)),
          row: Math.min(dims.rows - 1, Math.max(0, row)),
        });
      }}
      onMouseLeave={() => setPointer(null)}
    >
      {cells.map(({ key, col, row }) => (
        <div key={key} className={cn("border-[0.5px]", divClass, isLit(col, row) && activeDivsClass)} />
      ))}
    </div>
  );
}
