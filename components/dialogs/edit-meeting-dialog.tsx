"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useModalStore } from "@/hooks/use-modal-store";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import axios from "axios";
import { GeneratedAvatar } from "../generated-avatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { CreateAgentDialog } from "../create-agent-dialog";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { useAgents } from "@/lib/agents";
import { useRouter } from "next/navigation";
import { useMeeting } from "@/lib/meetings";

const formSchema = z.object({
  agentName: z.string().min(1),
  meetingTitle: z.string().min(1),
});

export const EditMeetingDialog = () => {
  const { isOpen, type, data: meetingData } = useModalStore();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [isFetching, setIsFetching] = useState(false);

  const { data: agents } = useAgents();
  const meetingById = useMeeting(meetingData.meetingId!);

  const existingAgent = agents?.find(
    (agent) => agent.id === meetingById.data?.agentId
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      meetingTitle: "",
      agentName: "",
    },
  });

  useEffect(() => {
    if (isOpen && type === "editMeeting") {
      if (!meetingById.data && existingAgent) {
        setIsFetching(true);
      } else if (!form.getValues().meetingTitle || !form.getValues().agentName) {
        setIsFetching(false);
        form.setValue("meetingTitle", meetingById.data?.title!);
        form.setValue("agentName", existingAgent?.name!);
      }
    }
  });

  const isModalOpen = isOpen && type === "editMeeting";

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        await axios
          .patch(
            `/api/meetings/updateByUser?meetingId=${meetingData.meetingId}`,
            data
          )
          .finally(() => {
            toast.success("Meeting updated successfully");
            useModalStore.getState().onClose();
            router.refresh();
          });
      } catch (error) {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={() => {
        useModalStore.getState().onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Meeting</DialogTitle>
          <DialogDescription>Edit a existing meeting</DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="meetingTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        autoComplete="off"
                        disabled={isPending || isFetching}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agentName"
                render={({ field }) => (
                  <FormItem>
                    <Label>Agent</Label>
                    {field.value.length === 0 && (
                      <Button
                        variant={"outline"}
                        type="button"
                        disabled={isPending || isFetching}
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
                      Not found what you are looking for? <CreateAgentDialog />
                    </span>
                    <CommandDialog open={open} onOpenChange={setOpen}>
                      <CommandInput placeholder="Search for an agent..." />
                      <CommandList className="px-0 mx-0">
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup className="mx-0 font-normal">
                          {agents?.map((agent) => (
                            <CommandItem
                              onSelect={() => {
                                form.setValue("agentName", agent.name);
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
                    variant={"outline"}
                    type="button"
                    disabled={isPending || isFetching}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="bg-[#ea721b] hover:bg-opacity-80 transition-all"
                  disabled={isPending || isFetching}
                >
                  <Loader2
                    className={cn(
                      "text-transparent -mr-6 size-5 transition-all",
                      isPending && "mr-0 animate-spin text-white transition-all"
                    )}
                  />
                  Update
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
