import { create } from 'zustand';

export type ModalStoreType = "editMeeting" | "deleteMeeting" | "createAgent" | "editAgent" | "deleteAgent";

interface ModalStoreData {
  meetingId?: string;
  agentId?: string;
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
    })
  },
  onClose: () => {
    set({
      type: null,
      isOpen: false,
    });
  },
}));
