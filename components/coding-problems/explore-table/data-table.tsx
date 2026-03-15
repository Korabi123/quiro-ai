"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  TableCell,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Loader, SearchIcon, ChevronsUpDown, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

const DifficultyFilter = ({ 
  value, 
  onChange 
}: { 
  value: string | undefined; 
  onChange: (value: string | undefined) => void 
}) => {
  const [open, setOpen] = React.useState(false);

  const difficulties = [
    {
      label: "Easy",
      value: "Easy",
    },
    {
      label: "Medium",
      value: "Medium",
    },
    {
      label: "Hard",
      value: "Hard",
    },
  ];

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="text-muted-foreground/70 hover:text-muted-foreground transition-all relative h-9"
      >
        {!value ? (
          <>
            Difficulty
            <ChevronsUpDown className="ml-2 h-4 w-4 inline" />
          </>
        ) : (
          <>
            <Badge
              variant={"outline"}
              className={cn(
                "font-medium mr-2",
                value === "Easy" && "bg-green-400/20 border-green-400/50 text-green-500",
                value === "Medium" && "bg-yellow-400/20 border-yellow-400/50 text-yellow-500",
                value === "Hard" && "bg-red-400/20 border-red-400/50 text-red-500"
              )}
            >
              {value}
            </Badge>
            <ChevronsUpDown className="ml-2 h-4 w-4 inline" />
          </>
        )}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search difficulty..." />
        <CommandList className="px-0 mx-0">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="mx-0 font-normal">
            {difficulties.map((difficulty) => (
              <CommandItem 
                onSelect={() => {
                  onChange(difficulty.value);
                  setOpen(false);
                }} 
                key={difficulty.value}
              >
                <Badge
                  variant={"outline"}
                  className={cn(
                    "font-medium mr-2",
                    difficulty.value === "Easy" && "bg-green-400/20 border-green-400/50 text-green-500",
                    difficulty.value === "Medium" && "bg-yellow-400/20 border-yellow-400/50 text-yellow-500",
                    difficulty.value === "Hard" && "bg-red-400/20 border-red-400/50 text-red-500"
                  )}
                >
                  {difficulty.value}
                </Badge>
                <span>{difficulty.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

const ClearFilterButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      variant={"outline"}
      size={"sm"}
      className={cn("text-black shadow-sm")}
      onClick={onClick}
    >
      <CircleX className="size-5" />
      Clear
    </Button>
  );
};

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    title: false,
  });
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnFilters,
      columnVisibility,
    },
  });

  const difficultyValue = table.getColumn("difficulty")?.getFilterValue() as string | undefined;

  const handleDifficultyChange = (value: string | undefined) => {
    table.getColumn("difficulty")?.setFilterValue(value);
    table.setPageIndex(0);
  };

  const hasFilters = difficultyValue || (table.getColumn("title")?.getFilterValue() as string);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="mt-14 rounded-2xl border border-border/50 bg-muted-foreground/5">
      <div className="flex items-center gap-2 p-5">
        <div className="relative flex-1 max-w-sm">
          <Input
            className="peer ps-9 pe-9"
            placeholder="Search problems..."
            type="search"
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) => {
              table.getColumn("title")?.setFilterValue(event.target.value);
              table.setPageIndex(0);
            }}
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
            <SearchIcon size={16} />
          </div>
        </div>
        <DifficultyFilter 
          value={difficultyValue} 
          onChange={handleDifficultyChange} 
        />
        {hasFilters && (
          <ClearFilterButton 
            onClick={() => {
              table.getColumn("difficulty")?.setFilterValue(undefined);
              table.getColumn("title")?.setFilterValue(undefined);
              table.setPageIndex(0);
            }} 
          />
        )}
      </div>
      {data.length === 0 && (
        <div className="flex items-center justify-center w-full p-5">
          <Loader className="size-5 animate-spin text-muted-foreground/70" />
          <p className="text-sm ml-2 text-muted-foreground/70">
            Loading problems...
          </p>
        </div>
      )}
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row, index) => (
          <>
            <div
              key={row.id}
              onClick={() => {
                const problem = row.original as { title: string };
                const slug = problem.title.toLowerCase().replace(/\s+/g, "-");
                router.push(`/coding-problems/${slug}`);
              }}
              className="flex cursor-pointer hover:bg-muted-foreground/10 only:rounded-2xl first:rounded-t-2xl last:rounded-b-2xl transition-all items-center justify-between w-full px-5 py-3"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-1">
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                </TableCell>
              ))}
            </div>
            {index !== table.getRowModel().rows.length - 1 && (
              <Separator key={`${row.id}-separator`} className="bg-border/60" />
            )}
          </>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center w-full p-5">
          <p className="text-sm text-muted-foreground/70">No problems found</p>
        </div>
      )}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ArrowLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
