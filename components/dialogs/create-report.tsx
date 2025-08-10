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
import { useTransition } from "react";
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

const formSchema = z.object({
  name: z.string().min(1),
  field: z.string().min(1),
  type: z.enum(["COMMUNICATION", "TECHNICAL", "LEADERSHIP", "ALL", "CUSTOM"]),
  customType: z.string().optional(),
});

export const CreateReportDialog = () => {
  const [isPending, startTransition] = useTransition();

  const { isOpen, type, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "createReport";

  const router = useRouter();

  const [animate] = useAutoAnimate();

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
                      isPending && "mr-0 animate-spin text-white transition-all"
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
