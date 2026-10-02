"use client";

import { useState } from "react";
import { Check, Github, GitFork, Loader2, Search, Star, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useGitHubRepos, useGradeMutations } from "@/lib/project-grading";
import type { GitHubRepoOption } from "@/lib/project-grading";

const RepoRow = ({
  repo,
  onLink,
  isPending,
}: {
  repo: GitHubRepoOption;
  onLink: (fullName: string) => void;
  isPending: boolean;
}) => {
  const [query, setQuery] = useState(repo.fullName);
  const [isEditing, setIsEditing] = useState(false);

  //* The input is unmounted while not editing, so it always mounts with the
  //* current `query`. Cancelling just resets the value explicitly - no effect
  //* needed to resync it from props.
  const cancelEditing = () => {
    setQuery(repo.fullName);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted-foreground/5 transition-colors">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {isEditing ? (
            <Input
              value={query}
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
              onBlur={cancelEditing}
              onKeyDown={(event) => {
                if (event.key === "Enter" && query.includes("/")) {
                  onLink(query.trim());
                  setIsEditing(false);
                }
                if (event.key === "Escape") {
                  cancelEditing();
                }
              }}
              className="h-7 text-xs font-mono"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium truncate text-left hover:underline decoration-dotted underline-offset-4"
              title="Click to type a repository manually"
            >
              {repo.fullName}
            </button>
          )}

          {repo.isFork && (
            <GitFork className="size-3 text-muted-foreground shrink-0" />
          )}
          {repo.isLinked && (
            <Badge variant="outline" className="text-[10px] text-green-700 border-green-500/30 bg-green-500/5">
              Linked
            </Badge>
          )}
        </div>

        {repo.description && (
          <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {repo.language && <span>{repo.language}</span>}
          <span className="flex items-center gap-1">
            <Star className="size-3" />
            {repo.stars}
          </span>
          {repo.lastGradedAt && repo.lastScore !== null && (
            <span>
              Last graded {repo.lastScore}/100 ({repo.lastLetterGrade})
            </span>
          )}
        </div>
      </div>

      {repo.isLinked ? (
        <Badge variant="outline" className="text-[10px] text-green-600 shrink-0">
          <Check className="size-3" />
        </Badge>
      ) : (
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={isPending}
          onClick={() => onLink(repo.fullName)}
          className="shrink-0"
        >
          {isPending && <Loader2 className="size-3 animate-spin" />}
          Link
        </Button>
      )}
    </div>
  );
};

export const RepoPickerDialog = ({
  trigger,
  repoCapReached,
}: {
  trigger: React.ReactNode;
  repoCapReached?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingRepo, setPendingRepo] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { data, error, isLoading, mutate } = useGitHubRepos();
  const { linkRepository } = useGradeMutations();

  const repositories = data?.repositories ?? [];
  const filtered = repositories.filter(
    (repo) =>
      !search ||
      repo.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleLink = async (fullName: string) => {
    setPendingRepo(fullName);
    try {
      const result = await linkRepository(fullName);
      toast.success(
        result.alreadyLinked ? "Already linked" : `Linked ${fullName}`
      );
      setIsOpen(false);
    } catch (linkError) {
      toast.error(
        linkError instanceof Error ? linkError.message : "Failed to link repository"
      );
    } finally {
      setPendingRepo(null);
    }
  };

  //* Connecting from inside the dialog rather than telling the user to find it
  //* elsewhere. `callbackURL` sends them back to grading instead of the generic
  //* post-login landing page, so the action they started is where they resume.
  const handleConnect = async () => {
    setIsConnecting(true);
    const { error: connectError } = await authClient.linkSocial(
      {
        provider: "github",
        //* Project Grading needs to enumerate repos and read file contents.
        //* Better Auth merges these additively with the provider defaults.
        scopes: ["repo", "read:org"],
        callbackURL: "/project-grading",
      },
      {
        onError: (ctx) => {
          setIsConnecting(false);
          toast.error(ctx.error.message ?? "Could not connect GitHub");
        },
      }
    );

    //* A successful call redirects away, so this only runs on failure.
    if (connectError) {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="size-4" />
            Add a repository
          </DialogTitle>
          <DialogDescription>
            Only public repositories are listed. Link one to run an AI review of its
            source.
          </DialogDescription>
        </DialogHeader>

        {repoCapReached && (
          <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
            <TriangleAlert className="size-4 shrink-0 mt-0.5" />
            You have reached your linked repository limit. Unlink one to add another.
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : error || !data?.connected ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-border/50 flex flex-col items-center gap-3">
            <Github className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-xs">
              {error
                ? "Could not load your repositories."
                : "Connect your GitHub account to list your public repositories."}
            </p>
            {!error && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isConnecting}
                onClick={handleConnect}
              >
                {isConnecting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Github className="size-4" />
                )}
                Connect GitHub
              </Button>
            )}
            {error && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => mutate()}
              >
                Retry
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute size-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter your repositories"
                className="pl-9"
              />
            </div>

            <ScrollArea className="max-h-[420px]">
              <div className={cn("flex flex-col divide-y divide-border/40 pr-3")}>
                {filtered.map((repo) => (
                  <RepoRow
                    key={repo.id}
                    repo={repo}
                    onLink={handleLink}
                    isPending={pendingRepo === repo.fullName}
                  />
                ))}
                {filtered.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No repositories match “{search}”.
                  </p>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};