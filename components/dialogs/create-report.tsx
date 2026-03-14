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
import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { mutate } from "swr";
import { useModalStore } from "@/hooks/use-modal-store";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useRouter } from "next/navigation";
import { Subscription } from "@better-auth/stripe";
import { authClient } from "@/lib/auth-client";
import { Badge } from "../ui/badge";

const formSchema = z.object({
  name: z.string().min(1),
  field: z.string().optional(),
  type: z.enum(["COMMUNICATION", "TECHNICAL", "LEADERSHIP", "ALL", "CUSTOM"]).optional(),
  customType: z.string().optional(),
});

export const CreateReportDialog = () => {
  const [isPending, startTransition] = useTransition();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [linkedIn, setLinkedIn] = useState<boolean>(true);

  const { isOpen, type, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "createReport";

  const router = useRouter();

  const [animate] = useAutoAnimate();

  useEffect(() => {
    const getSubscription = async () => {
      startTransition(async () => {
        await authClient.subscription
          .list()
          .then((res) => setSubscription(res?.data?.[0] ?? null));
      });
    };
    getSubscription();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      customType: "",
      field: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      if (data.type === "CUSTOM" && !data.customType) {
        form.setError("customType", { message: "Custom type is required" });
        return;
      } else {
        if (linkedIn === true) {
          const customData = {
            ...data,
            type: "CUSTOM",
            field: "Generated from a LinkedIn job posting",
          }
          try {
            await axios
              .post("/api/reports/create", customData)
              .then(() => {
                toast.success("Report created successfully");
                onClose();
                form.reset();
              })
              .finally(() => {
                mutate("/api/reports/get");
                router.refresh();
              });
          } catch (error) {
            toast.error("Something went wrong");
          }
        } else {
          try {
            await axios
              .post("/api/reports/create", data)
              .then(() => {
                toast.success("Report created successfully");
                onClose();
                form.reset();
              })
              .finally(() => {
                mutate("/api/reports/get");
                router.refresh();
              });
          } catch (error) {
            toast.error("Something went wrong");
          }
        }
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
          <DialogTitle>New Report</DialogTitle>
          <DialogDescription>Create a new report</DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <Form {...form}>
            <form
              ref={animate}
              className="space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
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
              {linkedIn === false && (
                <FormField
                  control={form.control}
                  name="field"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          autoComplete="off"
                          disabled={isPending}
                          placeholder="E.g 'Software Development'"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {linkedIn === false && (
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the type of report" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="COMMUNICATION">
                            Communication
                          </SelectItem>
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                          <SelectItem value="LEADERSHIP">Leadership</SelectItem>
                          <SelectItem value="ALL">All of the above</SelectItem>
                          <SelectItem value="CUSTOM">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {linkedIn === true && (
                <FormField
                  control={form.control}
                  name="customType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn job posting URL <Badge className="ml-2 bg-gradient-to-r from-[#ffd43e] via-[#ea721b] to-[#2f2722] text-white">Pro feature</Badge></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          autoComplete="off"
                          disabled={isPending}
                          placeholder="https://www.linkedin.com/jobs/view/3321346100/"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.watch("type") === "CUSTOM" && (
                <FormField
                  control={form.control}
                  name="customType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          autoComplete="off"
                          disabled={isPending}
                          placeholder="Enter custom type..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {subscription?.plan === "pro" && (
                <>
                  {linkedIn === false ? (
                    <div className="flex items-center gap-2 pb-4 -mt-8">
                      <span className="text-xs text-muted-foreground">
                        Want to get better questions?
                      </span>
                      <Button
                        type="button"
                        className="-ml-1 text-xs p-0 h-auto bg-transparent text-[#ffd43e]/70 hover:text-[#ffd43e] hover:bg-transparent transition-all"
                        onClick={() => {
                          setLinkedIn(true);
                          form.setValue("customType", undefined);
                        }}
                      >
                        Generate skill report from a LinkedIn job posting
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pb-4 -mt-8">
                      <span className="text-xs text-muted-foreground">
                        Prefer to give custom information?
                      </span>
                      <Button
                        type="button"
                        className="-ml-1 text-xs p-0 h-auto bg-transparent text-[#ffd43e]/70 hover:text-[#ffd43e] hover:bg-transparent transition-all"
                        onClick={() => setLinkedIn(false)}
                      >
                        Generate skill report from custom information
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
