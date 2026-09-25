import { create } from 'zustand';

type DialogPayload = { text: string; title?: string; onClose?: () => void };
type DialogState = { current: DialogPayload | null; show: (payload: DialogPayload) => void; hide: () => void };

export const useDialogStore = create<DialogState>((set, get) => ({
  current: null,
  show: (payload) => set({ current: payload }),
  hide: () => {
    const current = get().current;
    set({ current: null });
    current?.onClose?.();
  },
}));

/** Call this from any trigger: showGameDialog('Текст реплики'). */
export function showGameDialog(text: string, options?: Omit<DialogPayload, 'text'>) {
  useDialogStore.getState().show({ text, ...options });
}

export function hideGameDialog() {
  useDialogStore.getState().hide();
}
