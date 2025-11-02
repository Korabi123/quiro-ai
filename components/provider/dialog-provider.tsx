import { CreateAgentDialog } from "../dialogs/create-agent"
import { CreateReportDialog } from "../dialogs/create-report"
import { DeleteAgentDialog } from "../dialogs/delete-agent"
import { DeleteMeetingDialog } from "../dialogs/delete-meeting-dialog"
import { DeleteReportDialog } from "../dialogs/delete-report"
import { EditAgentDialog } from "../dialogs/edit-agent"
import { EditMeetingDialog } from "../dialogs/edit-meeting-dialog"
import { EditReportDialog } from "../dialogs/edit-report"
import { RestrictionDialog } from "../dialogs/restriction-dialog"

export const DialogProvider = () => {
  return (
    <>
      <EditMeetingDialog />
      <DeleteMeetingDialog />
      <CreateAgentDialog />
      <EditAgentDialog />
      <DeleteAgentDialog />
      <CreateReportDialog />
      <EditReportDialog />
      <DeleteReportDialog />
      <RestrictionDialog />
    </>
  )
}
