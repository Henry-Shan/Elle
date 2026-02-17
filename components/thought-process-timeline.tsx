'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolInvocation } from 'ai';
import { buildTimelineSteps } from '@/lib/timeline';
import { TimelineStepItem, StatusPhaseItem } from './timeline-step';
import { useGenerationStatus } from '@/hooks/use-generation-status';

export function ThoughtProcessTimeline({
  reasoning,
  toolInvocations,
  isLoading,
  isReadonly,
}: {
  reasoning?: string;
  toolInvocations?: ToolInvocation[];
  isLoading: boolean;
  isReadonly: boolean;
}) {
  const steps = useMemo(
    () => buildTimelineSteps({ reasoning, toolInvocations, isLoading }),
    [reasoning, toolInvocations, isLoading],
  );

  const { phases } = useGenerationStatus();

  if (steps.length === 0 && phases.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <AnimatePresence>
        {phases.map((phase) => (
          <motion.div
            key={phase.name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <StatusPhaseItem phase={phase} />
          </motion.div>
        ))}

        {steps.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <TimelineStepItem step={step} isReadonly={isReadonly} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
