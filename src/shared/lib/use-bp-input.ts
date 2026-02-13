import { useState, useCallback } from 'react';

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
      switch (activeField) {
        case 'systolic':
          setSystolic(value);
          if (autoAdvance && value.length === 3) setActiveField('diastolic');
          break;
        case 'diastolic':
          setDiastolic(value);
          if (autoAdvance && value.length === 3) setActiveField('pulse');
          break;
        case 'pulse':
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