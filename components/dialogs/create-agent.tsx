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
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { mutate } from "swr";
import { useModalStore } from "@/hooks/use-modal-store";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Badge } from "../ui/badge";
import { useSubscription } from "@/lib/subscription";

const formSchema = z.object({
  name: z.string().min(1),
  linkedInUrl: z.string().optional(),
  instructions: z.string().optional(),
});

export const CreateAgentDialog = () => {
  const [isPending, startTransition] = useTransition();
  const [instructionsType, setInstructionsType] = useState<"manual" | "linkedIn">("manual");
  const [animate] = useAutoAnimate();
  const { data: subscription } = useSubscription();

  const { isOpen, type, onOpen, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "createAgent";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      linkedInUrl: "",
      instructions: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (instructionsType === "linkedIn" && !data.linkedInUrl) {
      form.setError("linkedInUrl", {
        message: "Please enter a LinkedIn job posting URL",
      });
      return;
    } else if (instructionsType === "manual" && !data.instructions) {
      form.setError("instructions", {
        message: "Please enter instructions",
      });
      return;
    } else {
      startTransition(async () => {
        try {
          if (instructionsType === "linkedIn") {
            const res = await axios.post("/api/agents/generateInstructions", {
              linkedInUrl: data.linkedInUrl,
            });
            data.instructions = res.data;
          }

          await axios
            .post("/api/agents/create", data)
            .then(() => {
              toast.success("Agent created successfully");
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
    }
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
          <DialogTitle>New Agent</DialogTitle>
          <DialogDescription>Create a new agent</DialogDescription>
        </DialogHeader>
        <div ref={animate} className="mt-2">
          <Form {...form}>
            <form
              ref={animate}
              className="space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
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
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {instructionsType === "manual" && (
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
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {instructionsType === "linkedIn" && (
                <FormField
                  control={form.control}
                  name="linkedInUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn job posting URL <Badge className="ml-2 bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] text-white border-0">Pro feature</Badge></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://www.linkedin.com/jobs/view/3321346100/"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          autoComplete="off"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {subscription?.plan === "pro" && (
                <>
                  {instructionsType === "manual" && (
                    <div className="flex items-center gap-2 pb-4 -mt-8">
                      <span className="text-xs text-muted-foreground">
                        Can't string up instructions?
                      </span>
                      <Button
                        type="button"
                        className="text-xs p-0 h-auto bg-transparent text-[#ffd43e]/70 hover:text-[#ffd43e] hover:bg-transparent transition-all"
                        onClick={() => setInstructionsType("linkedIn")}
                      >
                        Generate instructions from a LinkedIn job posting
                      </Button>
                    </div>
                  )}
                  {instructionsType === "linkedIn" && (
                    <div className="flex items-center gap-2 pb-4 -mt-8">
                      <span className="text-xs text-muted-foreground">
                        Want to write your own instructions?
                      </span>
                      <Button
                        type="button"
                        className="text-xs p-0 h-auto bg-transparent text-[#ffd43e]/70 hover:text-[#ffd43e] hover:bg-transparent transition-all"
                        onClick={() => setInstructionsType("manual")}
                      >
                        Write your own instructions
                      </Button>
                    </div>
                  )}
                </>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    variant={"outline"}
                    type="button"
                    disabled={isPending}
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
                        "mr-0 animate-spin text-white transition-all",
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
