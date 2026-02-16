import { useState, useCallback } from 'react';
import { BP_LIMITS } from '../config';

export type BPActiveField = 'systolic' | 'diastolic' | 'pulse';

interface UseBPInputOptions {
  autoAdvance?: boolean;
}

export function useBPInput({ autoAdvance = false }: UseBPInputOptions = {}) {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [activeField, setActiveField] = useState<BPActiveField>('systolic');

  const handleNumpadChange = useCallback(
    (value: string) => {
      const numValue = value ? parseInt(value, 10) : 0;

      switch (activeField) {
        case 'systolic':
          if (value && numValue > BP_LIMITS.systolic.max) return;
          setSystolic(value);
          if (autoAdvance && value.length === 3) setActiveField('diastolic');
          break;
        case 'diastolic':
          if (value && numValue > BP_LIMITS.diastolic.max) return;
          setDiastolic(value);
          if (autoAdvance && value.length === 3) setActiveField('pulse');
          break;
        case 'pulse':
          if (value && numValue > BP_LIMITS.pulse.max) return;
          setPulse(value);
          break;
      }
    },
    [activeField, autoAdvance],
  );

  const getCurrentValue = useCallback((): string => {
    switch (activeField) {
      case 'systolic': return systolic;
      case 'diastolic': return diastolic;
      case 'pulse': return pulse;
    }
  }, [activeField, systolic, diastolic, pulse]);

  const reset = useCallback(() => {
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setActiveField('systolic');
  }, []);

  return {
    systolic, setSystolic,
    diastolic, setDiastolic,
    pulse, setPulse,
    activeField, setActiveField,
    handleNumpadChange,
    getCurrentValue,
    reset,
  };
}