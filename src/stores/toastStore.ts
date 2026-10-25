// Realtime In-App Toast Store
import { create } from 'zustand';

export type ToastType = 'success' | 'info' | 'warning' | 'alert';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  type?: ToastType;
  icon?: string;
  durationMs?: number;
  onPress?: () => void;
}

interface ToastState {
  currentToast: ToastData | null;
  showToast: (data: Omit<ToastData, 'id'> & { id?: string }) => void;
  hideToast: () => void;
}

let dismissTimer: any = null;

export const useToastStore = create<ToastState>((set) => ({
  currentToast: null,

  showToast: (data) => {
    if (dismissTimer) clearTimeout(dismissTimer);

    const toast: ToastData = {
      ...data,
      id: data.id || `toast-${Date.now().toString(36)}`,
      type: data.type || 'info',
      durationMs: data.durationMs || 4500,
    };

    set({ currentToast: toast });

    dismissTimer = setTimeout(() => {
      set({ currentToast: null });
    }, toast.durationMs);
  },

  hideToast: () => {
    if (dismissTimer) clearTimeout(dismissTimer);
    set({ currentToast: null });
  },
}));
