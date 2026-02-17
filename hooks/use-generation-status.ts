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

// Module-level dedup — survives React Strict Mode remounts
let seenEvents = new Set<string>();

export function useGenerationStatus() {
  const { data, mutate } = useSWR<GenerationStatus>(
    'generation-status',
    null,
    { fallbackData: initialStatus },
  );

  const status = useMemo(() => data ?? initialStatus, [data]);

  const addStep = useCallback(
    (raw: string) => {
      // Done signal always passes through
      if (raw === '') {
        mutate(
          (current) => {
            const prev = current ?? initialStatus;
            return {
              phases: prev.phases.map((p) => ({ ...p, isActive: false })),
              isActive: false,
            };
          },
          { revalidate: false },
        );
        return;
      }

      // Deduplicate by exact raw string — no counter needed
      if (seenEvents.has(raw)) return;
      seenEvents.add(raw);

      const sepIdx = raw.indexOf('::');
      const phaseName = sepIdx >= 0 ? raw.slice(0, sepIdx) : 'Processing';
      const stepText = sepIdx >= 0 ? raw.slice(sepIdx + 2) : raw;

      mutate(
        (current) => {
          const prev = current ?? initialStatus;
          const phases = prev.phases.map((p) => ({ ...p, isActive: false }));

          const existing = phases.find((p) => p.name === phaseName);
          if (existing) {
            existing.steps = [...existing.steps, stepText];
            existing.isActive = true;
          } else {
            phases.push({ name: phaseName, steps: [stepText], isActive: true });
          }

          return { phases, isActive: true };
        },
        { revalidate: false },
      );
    },
    [mutate],
  );

  const reset = useCallback(() => {
    seenEvents = new Set<string>();
    mutate(initialStatus, { revalidate: false });
  }, [mutate]);

  return useMemo(
    () => ({ ...status, addStep, reset }),
    [status, addStep, reset],
  );
}
