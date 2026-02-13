import { useState, useCallback } from 'react';

export function useToast() {
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'error' | 'warning'>('error');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((message: string, type: 'error' | 'warning' = 'error') => {
    setToastMsg(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => setToastVisible(false), []);

  return { toastMsg, toastType, toastVisible, showToast, hideToast };
}