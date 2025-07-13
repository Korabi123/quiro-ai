"use client";

import * as z from "zod";

import {
  ChevronRight,
  ChevronsUpDown,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  SlashIcon,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState, useTransition } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { CreateAgentDialog } from "../create-agent-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAgents } from "@/lib/agents";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";
import { mutate } from "swr";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { EditMeetingDialog } from "../dialogs/edit-meeting-dialog";
import { useModalStore } from "@/hooks/use-modal-store";

const formSchema = z.object({
  title: z.string().min(1),
  agent: z.string().min(1),
});

interface Props {
  secondary?: boolean;
  breadcrumb?: string | null | undefined;
  breadcrumbHref?: string | null | undefined;
  optionsHidden?: boolean;
  meetingId?: string;
}

export const MeetingHeading = ({
  secondary = false,
  breadcrumb = null,
  breadcrumbHref = null,
  optionsHidden = false,
  meetingId,
}: Props) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      agent: "",
    },
  });

  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { onOpen } = useModalStore();

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        await axios
          .post("/api/meetings/create", data)
          .then(() => {
            toast.success("Meeting created successfully");
            setDialogOpen((dialogOpen) => !dialogOpen);
            form.reset();
          })
          .finally(() => {
            mutate("/api/meetings/get");
          });
      } catch (error) {
        toast.error("Something went wrong");
      }
    });
  };

  const agents = useAgents();
  const router = useRouter();

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={() => {
        setDialogOpen((dialogOpen) => !dialogOpen);
        form.reset();
      }}
    >
      <div className="flex items-center justify-between w-full">
        {!secondary && (
          <>
            <h1 className="font-semibold md:text-3xl text-xl">My Meetings</h1>
            <DialogTrigger asChild>
              <Button className="bg-[#ea721b] hover:bg-opacity-80 transition-all">
                <Plus className="size-5" />
                New Meeting
              </Button>
            </DialogTrigger>
          </>
        )}
        {secondary && (
          <>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="font-semibold md:text-3xl text-xl">
                  <BreadcrumbLink asChild>
                    <Link href="/meetings">My Meetings</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className=" text-black" />
                </BreadcrumbSeparator>
                <BreadcrumbItem className="font-medium md:text-3xl text-xl">
                  <BreadcrumbPage className="font-medium">
                    {breadcrumb}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            {!optionsHidden && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={"ghost"} size={"icon"}>
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="p-0">
                    <DropdownMenuItem
                      onClick={() =>
                        onOpen("editMeeting", { meetingId: meetingId })
                      }
                      className="text-muted-foreground"
                    >
                      <Pencil />
                      Edit Meeting
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-none text-destructive focus:text-destructive focus:bg-destructive/10 transition-all">
                      <Trash2 />
                      Delete Meeting
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </>
        )}
        <DialogContent className="md:w-[550px] w-full">
          <DialogHeader>
            <DialogTitle>New Meeting</DialogTitle>
            <DialogDescription>Create a new meeting</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Title</Label>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agent"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Agent</Label>
                      {field.value.length === 0 && (
                        <Button
                          variant={"outline"}
                          type="button"
                          disabled={isPending}
                          onClick={() => setOpen(true)}
                          className="w-full mb-2 flex items-center cursor-pointer group justify-between rounded-xl hover:bg-muted transition-all border px-3 py-2 h-9"
                        >
                          <span className="text-sm text-muted-foreground/80 font-medium group-hover:text-muted-foreground transition-all">
                            Select an agent
                          </span>
                          <ChevronsUpDown className="size-4 text-muted-foreground/80 group-hover:text-muted-foreground transition-all" />
                        </Button>
                      )}
                      {field.value.length > 0 && (
                        <Button
                          variant={"outline"}
                          type="button"
                          disabled={isPending}
                          onClick={() => setOpen(true)}
                          className="w-full mb-2 flex items-center cursor-pointer group rounded-xl hover:bg-muted transition-all border px-3 py-2 h-9"
                        >
                          <GeneratedAvatar
                            seed={field.value}
                            className="size-6"
                          />
                          <span className="text-sm text-muted-foreground/80 font-medium group-hover:text-muted-foreground transition-all">
                            {field.value}
                          </span>
                          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground/80 group-hover:text-muted-foreground transition-all" />
                        </Button>
                      )}
                      <span className="text-sm pt-2 text-muted-foreground/80 font-medium">
                        Not found what you are looking for?{" "}
                        <CreateAgentDialog />
                      </span>
                      <CommandDialog open={open} onOpenChange={setOpen}>
                        <CommandInput placeholder="Search for an agent..." />
                        <CommandList className="px-0 mx-0">
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup className="mx-0 font-normal">
                            {agents.data?.map((agent) => (
                              <CommandItem
                                onSelect={() => {
                                  form.setValue("agent", agent.name);
                                  setOpen(false);
                                  router.refresh();
                                }}
                                key={agent.id}
                              >
                                <GeneratedAvatar
                                  seed={agent.name}
                                  className="size-8"
                                />
                                <span className="font-medium tracking-tight">
                                  {agent.name}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </CommandDialog>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      disabled={isPending}
                      variant={"outline"}
                      type="button"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="bg-[#ea721b] hover:bg-opacity-80 transition-all"
                    disabled={isPending}
                  >
                    <Loader2
                      className={cn(
                        "text-transparent -mr-6 size-5 transition-all",
                        isPending &&
                          "mr-0 animate-spin text-white transition-all"
                      )}
                    />
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
};
