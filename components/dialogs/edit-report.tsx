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
import { useReport } from "@/lib/reports";
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

let isSecondModalOpen = false;

const SecondaryModal = ({
  reportId,
  type,
  field,
  customType
}: {
  reportId: string;
  type: string;
  field: string;
  customType?: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { isOpen, type: modalType, onClose } = useModalStore();

  const isModalOpen = isOpen && modalType === "secondReportModal";

  const onSubmit = () => {
    startTransition(async () => {
      try {
        await axios
          .patch("/api/reports/patch", {
            name: field,
            field: field,
            type: type,
            customType: customType,
            reportId: reportId,
          })
          .then(() => {
            toast.success("Report updated successfully");
          })
          .finally(() => {
            onClose();
            mutate(`/api/reports/get?id=${reportId}`);
            router.push(`/reports/${reportId}/start`);
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
        onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to do this?</DialogTitle>
          <DialogDescription>
            By changing the type or field, you will have to take the report
            again meaning, you lose all the data associated with the report.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              onClick={() => {
                isSecondModalOpen = false;
              }}
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
            onClick={onSubmit}
          >
            <Loader2
              className={cn(
                "text-transparent -mr-6 size-5 transition-all",
                isPending && "mr-0 animate-spin text-white transition-all"
              )}
            />
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const EditReportDialog = () => {
  const [isPending, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);

  const { isOpen, type, data, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "editReport";

  const router = useRouter();
  const [animate] = useAutoAnimate();

  const { data: existingReport, isLoading } = useReport(data.reportId!);

  const { onOpen } = useModalStore();

  useEffect(() => {
    if (isModalOpen) {
      if (!existingReport || isLoading) {
        setIsFetching(true);
      } else {
        setIsFetching(false);
        form.setValue("name", existingReport.name);
        form.setValue("field", existingReport.field!);
        form.setValue("type", existingReport.type);
        if (existingReport.type === "CUSTOM" && existingReport.customType) {
          form.setValue("customType", existingReport.customType);
        }
      }
    }
  }, [existingReport, isLoading, isModalOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      field: "",
      customType: "",
    },
  });

  const onSubmit = (formData: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      if (formData.type === "CUSTOM" && !formData.customType) {
        form.setError("customType", { message: "Custom type is required" });
        return;
      } else if (
        formData.type !== existingReport?.type ||
        formData.field !== existingReport.field
      ) {
        onOpen("secondReportModal", {
          reportId: data.reportId,
          report: {
            name: existingReport?.name,
            type: existingReport?.type,
            field: existingReport?.field!,
            customType: existingReport?.customType!,
          }
        });
      } else {
        try {
          await axios
            .patch("/api/reports/edit", {
              name: formData.name,
              field: formData.field,
              type: formData.type,
              customType: formData.customType,
              reportId: data.reportId,
            })
            .then(() => {
              toast.success("Report updated successfully");
              onClose();
              form.reset();
            })
            .finally(() => {
              mutate("/api/reports/get");
              mutate(`/api/reports/get?id=${data.reportId}`);
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
          <DialogTitle>Edit Report</DialogTitle>
          <DialogDescription>Update your report details</DialogDescription>
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
                        disabled={isPending || isFetching}
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
                        disabled={isPending || isFetching}
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
                      value={field.value}
                      disabled={isPending || isFetching}
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
                          disabled={isPending || isFetching}
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
      <SecondaryModal
        reportId={data.reportId!}
        type={form.watch("type")}
        field={form.watch("field")}
      />
    </Dialog>
  );
};
