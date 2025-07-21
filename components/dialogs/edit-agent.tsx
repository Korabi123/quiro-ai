"use client";

import * as z from "zod";

import { Button } from "@/components/ui/button";
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
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { mutate } from "swr";
import { useModalStore } from "@/hooks/use-modal-store";
import { useAgent } from "@/lib/agents";

const formSchema = z.object({
  name: z.string().min(1),
  instructions: z.string().min(1).max(1000),
});

export const EditAgentDialog = () => {
  const [isPending, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);

  const { isOpen, type, data, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "editAgent";

  const { data: agentById, isLoading } = useAgent(data.agentId!);

  useEffect(() => {
    if (isModalOpen) {
      if (!agentById || isLoading) {
        setIsFetching(true);
      } else {
        setIsFetching(false);
        form.setValue("name", agentById.name);
        form.setValue("instructions", agentById.instructions);
      }
    }
  }, [agentById, isLoading, isModalOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      instructions: "",
    },
  });

  const onSubmit = (formData: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        await axios
          .patch("/api/agents/edit", {
            name: formData.name,
            instructions: formData.instructions,
            agentId: data.agentId,
          })
          .then(() => {
            toast.success("Agent edited successfully");
            onClose();
            form.reset();
          })
          .finally(() => {
            mutate("/api/agents/get");
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
        form.reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>Edit an existing agent</DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <GeneratedAvatar seed={form.watch("name")} className="size-14" />
              <FormField
                control={form.control}
                name="name"
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
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="You are a hiring manager at Google. You will be conducting my interview for the senior software engineer position. You will ask me common interview questions and give me feedback on my answers."
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        autoComplete="off"
                        rows={5}
                        className="resize-none"
                        disabled={isPending || isFetching}
                      />
                    </FormControl>
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
