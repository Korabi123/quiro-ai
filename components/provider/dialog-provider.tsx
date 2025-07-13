import { DeleteMeetingDialog } from "../dialogs/delete-meeting-dialog"
import { EditMeetingDialog } from "../dialogs/edit-meeting-dialog"

export const DialogProvider = () => {
  return (
    <>
      <EditMeetingDialog />
      <DeleteMeetingDialog />
    </>
  )
}
