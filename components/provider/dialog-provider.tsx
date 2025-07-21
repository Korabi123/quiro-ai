import { CreateAgentDialog } from "../dialogs/create-agent"
import { DeleteAgentDialog } from "../dialogs/delete-agent"
import { DeleteMeetingDialog } from "../dialogs/delete-meeting-dialog"
import { EditAgentDialog } from "../dialogs/edit-agent"
import { EditMeetingDialog } from "../dialogs/edit-meeting-dialog"

export const DialogProvider = () => {
  return (
    <>
      <EditMeetingDialog />
      <DeleteMeetingDialog />
      <CreateAgentDialog />
      <EditAgentDialog />
      <DeleteAgentDialog />
    </>
  )
}
