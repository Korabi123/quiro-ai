"use client";

import * as z from "zod";

import {
  ChevronRight,
  ChevronsUpDown,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
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
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useTransition } from "react";

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
import { CreateAgentDialog } from "@/components/create-agent-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAgents } from "@/lib/agents";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";
import { mutate } from "swr";
import { useModalStore } from "@/hooks/use-modal-store";

const formSchema = z.object({
  title: z.string().min(1),
  agent: z.string().min(1),
});

export const CreateMeetingDialog = () => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { isOpen, type, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "createMeeting";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      agent: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        await axios
          .post("/api/meetings/create", data)
          .then(() => {
            toast.success("Meeting created successfully");
            onClose();
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
      open={isModalOpen}
      onOpenChange={() => {
        useModalStore.getState().onClose();
        form.reset();
      }}
    >
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
    </Dialog>
  );
};