import { create } from 'zustand';

interface ToastState {
  message: string;
  type: 'error' | 'warning';
  visible: boolean;
  showToast: (message: string, type?: 'error' | 'warning') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'error',
  visible: false,
  showToast: (message, type = 'error') => set({ message, type, visible: true }),
  hideToast: () => set({ visible: false }),
}));
