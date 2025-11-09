import { CreateAgentDialog } from "@/components/dialogs/create-agent";
import { DeleteAgentDialog } from "@/components/dialogs/delete-agent";
import { EditAgentDialog } from "@/components/dialogs/edit-agent";
import { CreateMeetingDialog } from "@/components/dialogs/create-meeting-dialog";
import { DeleteMeetingDialog } from "@/components/dialogs/delete-meeting-dialog";
import { EditMeetingDialog } from "@/components/dialogs/edit-meeting-dialog";
import { CreateReportDialog } from "@/components/dialogs/create-report";
import { DeleteReportDialog } from "@/components/dialogs/delete-report";
import { EditReportDialog } from "@/components/dialogs/edit-report";
import { RestrictionDialog } from "@/components/dialogs/restriction-dialog";

export const DialogProvider = () => {
  return (
    <>
      <CreateAgentDialog />
      <DeleteAgentDialog />
      <EditAgentDialog />
      <CreateMeetingDialog />
      <DeleteMeetingDialog />
      <EditMeetingDialog />
      <CreateReportDialog />
      <DeleteReportDialog />
      <EditReportDialog />
      <RestrictionDialog />
    </>
  );
};
