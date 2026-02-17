'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolInvocation } from 'ai';
import { buildTimelineSteps } from '@/lib/timeline';
import {
  TimelineStepItem,
  StatusPhaseItem,
  PipelineSummaryBlock,
  LegalSearchGroupItem,
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

  // Split steps: legalSearch grouped, others individual
  const legalSearchSteps = useMemo(
    () => steps.filter((s) => s.toolName === 'legalSearch'),
    [steps],
  );
  const otherSteps = useMemo(
    () => steps.filter((s) => s.toolName !== 'legalSearch'),
    [steps],
  );

  // -----------------------------------------------------------------------
  // Staggered reveal — show one phase at a time, 600ms apart
  // If pipeline is already done on mount, show all immediately (no stagger)
  // -----------------------------------------------------------------------
  const pipelineDoneOnMount = useRef(!pipelineActive && phases.length > 0);
  const hadSummaryRef = useRef(false);
  const [revealedCount, setRevealedCount] = useState(
    pipelineDoneOnMount.current ? phases.length : 0,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNextReveal = useCallback(
    (current: number, target: number) => {
      if (current >= target) return;
      if (timerRef.current) return;

      const delay = current === 0 ? 0 : 600;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setRevealedCount((c) => c + 1);
      }, delay);
    },
    [],
  );

  useEffect(() => {
    if (phases.length === 0) {
      setRevealedCount(0);
      pipelineDoneOnMount.current = false;
      hadSummaryRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [phases.length]);

  useEffect(() => {
    if (!pipelineDoneOnMount.current) {
      scheduleNextReveal(revealedCount, phases.length);
    }
  }, [revealedCount, phases.length, scheduleNextReveal]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

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

  // Skip mount animations when phases are already complete (e.g., artifact
  // panel mounting a fresh timeline, or transitioning from summary to phases)
  const skipAnimations = pipelineDoneOnMount.current || hadSummaryRef.current;

  // Delay showing legal search block after phases finish
  const [showLegalSearch, setShowLegalSearch] = useState(false);
  const hasLegalSearch = legalSearchSteps.length > 0;
  const canShowLegalSearch = hasLegalSearch && phases.length > 0 && allRevealed && !pipelineActive;

  useEffect(() => {
    if (canShowLegalSearch && !showLegalSearch) {
      const timer = setTimeout(() => setShowLegalSearch(true), 400);
      return () => clearTimeout(timer);
    }
    if (!canShowLegalSearch && !hasLegalSearch) {
      setShowLegalSearch(false);
    }
  }, [canShowLegalSearch, showLegalSearch, hasLegalSearch]);

  // Reset when phases clear
  useEffect(() => {
    if (phases.length === 0) setShowLegalSearch(false);
  }, [phases.length]);

  if (steps.length === 0 && phases.length === 0) return null;

  const pipelineDone = visiblePhases.length > 0 && !effectivePipelineActive;
  const showSummary = pipelineDone && isLoading;

  // Track that summary was shown so we skip animations when switching back
  if (showSummary) hadSummaryRef.current = true;

  return (
    <div className="flex flex-col">
      {/* While generating response: single collapsed summary */}
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
            initial={skipAnimations ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.25 }}
          >
            <StatusPhaseItem
              phase={phase}
              index={i + 1}
              isLast={i === visiblePhases.length - 1 && !showLegalSearch}
              pipelineActive={effectivePipelineActive}
            />
          </motion.div>
        ))}

      {/* Grouped Legal Search block — appears after all phases with delay */}
      {!showSummary && showLegalSearch && (
        <motion.div
          key="legal-search-group"
          initial={skipAnimations ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.25 }}
        >
          <LegalSearchGroupItem
            steps={legalSearchSteps}
            isReadonly={isReadonly}
          />
        </motion.div>
      )}

      {/* Other tool steps (createDocument, etc.) */}
      {!showSummary && (
        <AnimatePresence>
          {otherSteps.map((step) => (
            <motion.div
              key={step.id}
              initial={skipAnimations ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <TimelineStepItem step={step} isReadonly={isReadonly} />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

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
