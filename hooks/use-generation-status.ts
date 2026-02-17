'use client';

import useSWR from 'swr';
import { useCallback, useMemo } from 'react';

export interface StatusPhase {
  name: string;
  steps: string[];
  isActive: boolean;
}

interface GenerationStatus {
  phases: StatusPhase[];
  isActive: boolean;
}

const initialStatus: GenerationStatus = {
  phases: [],
  isActive: false,
};

/**
 * Status events use the format "PhaseName::step text".
 * Empty string '' signals all phases are done.
 */
export function useGenerationStatus() {
  const { data, mutate } = useSWR<GenerationStatus>(
    'generation-status',
    null,
    { fallbackData: initialStatus },
  );

  const status = useMemo(() => data ?? initialStatus, [data]);

  const addStep = useCallback(
    (raw: string) => {
      mutate((current) => {
        const prev = current ?? initialStatus;

        // Empty = pipeline done
        if (raw === '') {
          return {
            phases: prev.phases.map((p) => ({ ...p, isActive: false })),
            isActive: false,
          };
        }

        const sepIdx = raw.indexOf('::');
        const phaseName = sepIdx >= 0 ? raw.slice(0, sepIdx) : 'Processing';
        const stepText = sepIdx >= 0 ? raw.slice(sepIdx + 2) : raw;

        // Mark all previous phases as inactive
        const phases = prev.phases.map((p) => ({ ...p, isActive: false }));

        const existing = phases.find((p) => p.name === phaseName);
        if (existing) {
          existing.steps = [...existing.steps, stepText];
          existing.isActive = true;
        } else {
          phases.push({ name: phaseName, steps: [stepText], isActive: true });
        }

        return { phases, isActive: true };
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
