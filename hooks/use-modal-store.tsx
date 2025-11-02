import { create } from "zustand";

export type ModalStoreType =
  | "editMeeting"
  | "deleteMeeting"
  | "createAgent"
  | "editAgent"
  | "deleteAgent"
  | "createReport"
  | "editReport"
  | "deleteReport"
  | "secondReportModal"
  | "restrictionDialog";

interface ModalStoreData {
  meetingId?: string;
  agentId?: string;
  reportId?: string;
  report?: {
    name?: string;
    type?: "COMMUNICATION" | "TECHNICAL" | "LEADERSHIP" | "ALL" | "CUSTOM";
    field?: string;
    customType?: string;
  };
  restrictionDialogData?: {
    dialogDescription?: string;
  };
}

interface ModalStoreInterface {
  type: ModalStoreType | null;
  data: ModalStoreData;
  isOpen: boolean;
  onOpen: (type: ModalStoreType, data?: ModalStoreData) => void;
  onClose: () => void;
}

export const useModalStore = create<ModalStoreInterface>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data) => {
    set({
      isOpen: true,
      type,
      data,
    });
  },
  onClose: () => {
    set({
      type: null,
      isOpen: false,
    });
  },
}));
