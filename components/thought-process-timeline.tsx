'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolInvocation } from 'ai';
import { buildTimelineSteps } from '@/lib/timeline';
import { CheckCircleFillIcon, ChevronDownIcon, LoaderIcon } from './icons';
import { TimelineStepItem } from './timeline-step';

const collapseVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    marginTop: 0,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    marginTop: 12,
  },
};

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

  const [isExpanded, setIsExpanded] = useState(true);

  if (steps.length === 0) return null;

  const allDone = steps.every((s) => s.status === 'completed');
  const isStreaming = !allDone;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <button
        type="button"
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isStreaming ? (
          <>
            <span className="text-sm font-medium">j...</span>
            <span className="animate-spin text-muted-foreground">
              <LoaderIcon size={14} />
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-medium">Thought Process</span>
            <span className="text-emerald-500">
              <CheckCircleFillIcon size={14} />
            </span>
            <span className="text-xs text-muted-foreground">
              {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            </span>
          </>
        )}
        <ChevronDownIcon
          size={14}
          className={`transition-transform duration-200 text-muted-foreground opacity-0 group-hover:opacity-100 ${
            isExpanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="timeline-body"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={collapseVariants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="relative pl-[11px]">
              {/* Vertical line */}
              <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />

              {/* Steps */}
              {steps.map((step) => (
                <TimelineStepItem
                  key={step.id}
                  step={step}
                  isReadonly={isReadonly}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
