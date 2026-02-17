'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolInvocation } from 'ai';
import { buildTimelineSteps } from '@/lib/timeline';
import {
  TimelineStepItem,
  StatusPhaseItem,
  PipelineSummaryBlock,
} from './timeline-step';
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

  // -----------------------------------------------------------------------
  // Staggered reveal — show one phase at a time, 600ms apart
  // Uses a ref-based timer so rapid phases.length changes don't reset it.
  // -----------------------------------------------------------------------
  const [revealedCount, setRevealedCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNextReveal = useCallback(
    (current: number, target: number) => {
      if (current >= target) return;
      if (timerRef.current) return; // already scheduled

      const delay = current === 0 ? 0 : 600;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setRevealedCount((c) => c + 1);
      }, delay);
    },
    [],
  );

  // Reset when phases clear (new message)
  useEffect(() => {
    if (phases.length === 0) {
      setRevealedCount(0);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [phases.length]);

  // Drive the reveal chain
  useEffect(() => {
    scheduleNextReveal(revealedCount, phases.length);
  }, [revealedCount, phases.length, scheduleNextReveal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Build visible phases — last revealed stays "active" if more are queued
  const visiblePhases = useMemo(() => {
    return phases.slice(0, revealedCount).map((phase, i) => {
      if (i === revealedCount - 1 && revealedCount < phases.length) {
        return { ...phase, isActive: true };
      }
      return phase;
    });
  }, [phases, revealedCount]);

  const allRevealed = revealedCount >= phases.length;
  const effectivePipelineActive = pipelineActive || !allRevealed;

  if (steps.length === 0 && phases.length === 0) return null;

  const pipelineDone = visiblePhases.length > 0 && !effectivePipelineActive;
  const showSummary = pipelineDone && isLoading;

  return (
    <div className="flex flex-col">
      {/* While generating response: single collapsed summary (includes tool steps) */}
      {showSummary && (
        <motion.div
          key="pipeline-summary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PipelineSummaryBlock phases={phases} toolSteps={steps} />
        </motion.div>
      )}

      {/* During pipeline OR after response complete: individual phase blocks */}
      {!showSummary &&
        visiblePhases.map((phase, i) => (
          <motion.div
            key={phase.name}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.25 }}
          >
            <StatusPhaseItem
              phase={phase}
              index={i + 1}
              isLast={i === visiblePhases.length - 1}
              pipelineActive={effectivePipelineActive}
            />
          </motion.div>
        ))}

      {/* Tool invocation steps — legalSearch waits for all phases, others show normally */}
      {!showSummary && (() => {
        const hasLegalSearch = steps.some((s) => s.toolName === 'legalSearch');
        const canShowToolSteps = !hasLegalSearch || (phases.length > 0 && allRevealed);
        return canShowToolSteps ? (
          <AnimatePresence>
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
        ) : null;
      })()}

      {/* Generating response — at the very bottom */}
      {showSummary && (
        <motion.div
          key="generating"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="group/gen flex items-center gap-2.5 py-2.5 cursor-default"
        >
          <motion.span
            className="relative flex size-2 shrink-0"
            animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <span className="absolute inline-flex size-full rounded-full bg-foreground/40 animate-[ping_1s_ease-in-out_infinite]" />
            <span className="relative inline-flex size-2 rounded-full bg-foreground" />
          </motion.span>
          <span className="text-xs font-mono tracking-wide text-foreground">
            Generating response
          </span>
        </motion.div>
      )}
    </div>
  );
}
