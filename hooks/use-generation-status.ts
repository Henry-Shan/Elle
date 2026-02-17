'use client';

import useSWR from 'swr';
import { useCallback, useMemo } from 'react';

interface GenerationStatus {
  steps: string[];
  isActive: boolean;
}

const initialStatus: GenerationStatus = {
  steps: [],
  isActive: false,
};

export function useGenerationStatus() {
  const { data, mutate } = useSWR<GenerationStatus>(
    'generation-status',
    null,
    { fallbackData: initialStatus },
  );

  const status = useMemo(() => data ?? initialStatus, [data]);

  const addStep = useCallback(
    (step: string) => {
      mutate((current) => {
        const prev = current ?? initialStatus;
        if (step === '') {
          return { steps: prev.steps, isActive: false };
        }
        return { steps: [...prev.steps, step], isActive: true };
      });
    },
    [mutate],
  );

  const reset = useCallback(() => {
    mutate(initialStatus);
  }, [mutate]);

  return useMemo(
    () => ({ ...status, addStep, reset }),
    [status, addStep, reset],
  );
}
