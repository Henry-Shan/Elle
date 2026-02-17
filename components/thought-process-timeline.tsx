'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolInvocation } from 'ai';
import { buildTimelineSteps } from '@/lib/timeline';
import { TimelineStepItem, StatusStepItem } from './timeline-step';
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

  const { steps: statusSteps, isActive } = useGenerationStatus();

  if (steps.length === 0 && statusSteps.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {/* Render status steps (RAG pipeline sub-steps) */}
        {statusSteps.map((stepText, i) => {
          const isLatest = i === statusSteps.length - 1;
          const isDone = !isActive || !isLatest;
          return (
            <motion.div
              key={`status-${i}-${stepText}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <StatusStepItem
                label={stepText}
                isDone={isDone}
              />
            </motion.div>
          );
        })}

        {/* Render tool / reasoning steps */}
        {steps.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TimelineStepItem
              step={step}
              isReadonly={isReadonly}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
