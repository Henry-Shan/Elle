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

  const { phases, isActive: pipelineActive } = useGenerationStatus();

  if (steps.length === 0 && phases.length === 0) return null;

  return (
    <div className="flex flex-col">
      <AnimatePresence>
        {phases.map((phase, i) => (
          <motion.div
            key={phase.name}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
          >
            <StatusPhaseItem
              phase={phase}
              index={i + 1}
              isLast={i === phases.length - 1}
              pipelineActive={pipelineActive}
            />
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

        {/* Generating response — appears at the very bottom once pipeline is done */}
        {phases.length > 0 && !pipelineActive && isLoading && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="group/gen flex items-center gap-2.5 py-2.5 cursor-default"
          >
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full rounded-full bg-foreground/20 animate-[ping_1.5s_ease-in-out_infinite]" />
              <span className="relative inline-flex size-2 rounded-full bg-foreground/40 group-hover/gen:bg-foreground transition-colors duration-300" />
            </span>
            <span className="text-xs font-mono tracking-wide text-muted-foreground/60 group-hover/gen:text-foreground/80 transition-colors duration-300">
              Generating response
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
