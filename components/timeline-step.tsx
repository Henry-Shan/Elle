'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimelineStep } from '@/lib/timeline';
import type { StatusPhase } from '@/hooks/use-generation-status';
import {
  GlobeIcon,
  FileIcon,
  PencilEditIcon,
  MessageIcon,
} from './icons';
import { Markdown } from './markdown';
import { Weather } from './weather';
import { DocumentPreview } from './document-preview';
import { DocumentToolCall, DocumentToolResult } from './document';
import cx from 'classnames';

const toolIconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  getWeather: GlobeIcon,
  webSearch: GlobeIcon,
  createDocument: FileIcon,
  updateDocument: PencilEditIcon,
  requestSuggestions: MessageIcon,
  legalSearch: FileIcon,
};

function getToolIcon(toolName?: string) {
  if (!toolName) return null;
  return toolIconMap[toolName] || null;
}

function padIndex(n: number) {
  return String(n).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Phase block (status pipeline phases) — shown during active pipeline
// ---------------------------------------------------------------------------

export function StatusPhaseItem({
  phase,
  index,
  isLast,
  pipelineActive,
}: {
  phase: StatusPhase;
  index: number;
  isLast: boolean;
  pipelineActive: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const wasActive = useRef(phase.isActive);

  // Auto-collapse when phase transitions from active → done
  useEffect(() => {
    if (wasActive.current && !phase.isActive) {
      const timer = setTimeout(() => setExpanded(false), 200);
      return () => clearTimeout(timer);
    }
    wasActive.current = phase.isActive;
  }, [phase.isActive]);

  const latestStep = phase.steps[phase.steps.length - 1];

  return (
    <motion.div
      className="group/phase relative cursor-default"
      animate={{ opacity: phase.isActive ? 1 : 0.8 }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-2.5 py-1.5">
        {/* Dot indicator */}
        <div className="mt-1 shrink-0">
          {phase.isActive ? (
            <motion.span
              className="relative flex size-2"
              animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <span className="absolute inline-flex size-full rounded-full bg-foreground/40 animate-[ping_1s_ease-in-out_infinite]" />
              <span className="relative inline-flex size-2 rounded-full bg-foreground" />
            </motion.span>
          ) : (
            <span className="inline-flex size-2 rounded-full bg-muted-foreground/40 group-hover/phase:bg-foreground transition-colors duration-300" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            className="flex items-center gap-2 w-full text-left"
            onClick={() => setExpanded((e) => !e)}
          >
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground/50 group-hover/phase:text-muted-foreground/80 transition-colors duration-300">
              {padIndex(index)}
            </span>
            <span className="text-xs font-mono tracking-wide uppercase group-hover/phase:text-foreground transition-colors duration-300">
              {phase.name}
            </span>
            {phase.isActive && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[9px] font-mono tracking-widest px-1.5 py-px rounded bg-foreground/8 text-foreground/50"
              >
                RUNNING
              </motion.span>
            )}
          </button>

          {/* Expanded sub-steps */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="steps"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mt-1.5 flex flex-col gap-px">
                  {phase.steps.map((step, i) => {
                    const isCurrent = phase.isActive && i === phase.steps.length - 1;
                    return (
                      <motion.span
                        key={`${phase.name}-${i}`}
                        className={cx(
                          'text-[11px] font-mono leading-relaxed block transition-colors duration-300',
                          isCurrent
                            ? 'text-foreground/80 group-hover/phase:text-foreground'
                            : 'text-muted-foreground/55 group-hover/phase:text-muted-foreground/90',
                        )}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {step}
                      </motion.span>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed: show last step as summary */}
          {!expanded && latestStep && (
            <span className="text-[11px] font-mono text-muted-foreground/45 group-hover/phase:text-muted-foreground/80 block mt-0.5 truncate transition-colors duration-300">
              {latestStep}
            </span>
          )}
        </div>
      </div>

      {/* Connector line between phases */}
      {(!isLast || pipelineActive) && (
        <div className="absolute left-[3px] top-[22px] bottom-0 w-px bg-border/30" />
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline summary — collapsed single block after pipeline completes
// ---------------------------------------------------------------------------

export function PipelineSummaryBlock({
  phases,
  toolSteps = [],
}: {
  phases: StatusPhase[];
  toolSteps?: TimelineStep[];
}) {
  const [expanded, setExpanded] = useState(false);
  const totalSteps = phases.reduce((sum, p) => sum + p.steps.length, 0);
  const totalItems = phases.length + toolSteps.length;

  return (
    <div className="group/summary relative cursor-default opacity-50 hover:opacity-80 transition-opacity duration-300">
      <div className="flex items-center gap-2.5 py-1.5">
        <span className="inline-flex size-2 shrink-0 rounded-full bg-muted-foreground/40 group-hover/summary:bg-foreground transition-colors duration-300" />
        <div className="flex-1 min-w-0">
          <button
            type="button"
            className="flex items-center gap-2 w-full text-left"
            onClick={() => setExpanded((e) => !e)}
          >
            <span className="text-xs font-mono tracking-wide uppercase group-hover/summary:text-foreground transition-colors duration-300">
              Researched
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/40 group-hover/summary:text-muted-foreground/70 transition-colors duration-300">
              {totalItems} phases · {totalSteps} steps
            </span>
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="summary-phases"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {phases.map((phase, i) => (
                    <span
                      key={phase.name}
                      className="text-[11px] font-mono text-muted-foreground/55 group-hover/summary:text-muted-foreground/90 leading-relaxed block transition-colors duration-300"
                    >
                      {padIndex(i + 1)} {phase.name}
                      <span className="text-muted-foreground/35 group-hover/summary:text-muted-foreground/60 transition-colors duration-300">
                        {' '}&mdash; {phase.steps[phase.steps.length - 1]}
                      </span>
                    </span>
                  ))}
                  {toolSteps.map((step) => (
                    <span
                      key={step.id}
                      className="text-[11px] font-mono text-muted-foreground/55 group-hover/summary:text-muted-foreground/90 leading-relaxed block transition-colors duration-300"
                    >
                      {padIndex(phases.length + 1)}{' '}
                      {step.toolDisplayName || step.toolName}
                      {step.type === 'tool' && step.toolInvocation?.state === 'result' && (
                        <span className="text-muted-foreground/35 group-hover/summary:text-muted-foreground/60 transition-colors duration-300">
                          {' '}&mdash; Complete
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool / reasoning block
// ---------------------------------------------------------------------------

export function TimelineStepItem({
  step,
  isReadonly,
}: {
  step: TimelineStep;
  isReadonly: boolean;
}) {
  const [view, setView] = useState<'collapsed' | 'preview' | 'expanded'>(
    'preview',
  );

  const isCompleted = step.status === 'completed';
  const ToolIcon = step.type === 'tool' ? getToolIcon(step.toolName) : null;

  const hasContent =
    (step.type === 'reasoning' && step.reasoning) ||
    (step.type === 'tool' && step.toolInvocation);

  const toggleFromTitle = () => {
    if (!hasContent) return;
    setView((v) => (v === 'collapsed' ? 'preview' : 'collapsed'));
  };

  return (
    <motion.div
      className="group/step py-1.5 cursor-default"
      animate={{ opacity: isCompleted ? 0.8 : 1 }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-1 shrink-0">
          {!isCompleted ? (
            <motion.span
              className="relative flex size-2"
              animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <span className="absolute inline-flex size-full rounded-full bg-foreground/40 animate-[ping_1s_ease-in-out_infinite]" />
              <span className="relative inline-flex size-2 rounded-full bg-foreground" />
            </motion.span>
          ) : (
            <span className="inline-flex size-2 rounded-full bg-muted-foreground/40 group-hover/step:bg-foreground transition-colors duration-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <button
            type="button"
            className="flex items-center gap-2 w-full text-left"
            onClick={toggleFromTitle}
          >
            {ToolIcon && (
              <span className="text-muted-foreground/60 group-hover/step:text-muted-foreground transition-colors duration-300">
                <ToolIcon size={13} />
              </span>
            )}
            <span className="text-xs font-mono tracking-wide uppercase group-hover/step:text-foreground transition-colors duration-300">
              {step.type === 'reasoning'
                ? 'Reasoning'
                : step.toolDisplayName || step.toolName}
            </span>
            {!isCompleted && step.type === 'tool' && (
              <span className="text-[9px] font-mono tracking-widest px-1.5 py-px rounded bg-foreground/8 text-foreground/50">
                RUNNING
              </span>
            )}
          </button>

          {hasContent && view !== 'collapsed' && (
            <AnimatePresence initial={false}>
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div className="mt-2">
                  {step.type === 'reasoning' && step.reasoning && (
                    <ContentPreview
                      isExpanded={view === 'expanded'}
                      onExpand={() => setView('expanded')}
                    >
                      <div className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                        <Markdown>{step.reasoning}</Markdown>
                      </div>
                    </ContentPreview>
                  )}

                  {step.type === 'tool' && step.toolInvocation && (
                    <ContentPreview
                      isExpanded={view === 'expanded'}
                      onExpand={() => setView('expanded')}
                    >
                      <ToolContent
                        toolInvocation={step.toolInvocation}
                        isReadonly={isReadonly}
                      />
                    </ContentPreview>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Content preview — 3-line clip with gradient
// ---------------------------------------------------------------------------

function ContentPreview({
  isExpanded,
  onExpand,
  children,
}: {
  isExpanded: boolean;
  onExpand: () => void;
  children: React.ReactNode;
}) {
  if (isExpanded) {
    return <>{children}</>;
  }

  return (
    <button
      type="button"
      className="relative text-left w-full"
      onClick={onExpand}
    >
      <div className="max-h-[4.2em] overflow-hidden leading-[1.4em]">
        {children}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      <span className="text-[10px] font-mono text-muted-foreground/40 mt-1 inline-block hover:text-muted-foreground transition-colors duration-300">
        show more
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tool content renderers
// ---------------------------------------------------------------------------

function ToolContent({
  toolInvocation,
  isReadonly,
}: {
  toolInvocation: TimelineStep['toolInvocation'];
  isReadonly: boolean;
}) {
  if (!toolInvocation) return null;

  const { toolName, state, args } = toolInvocation;

  if (state === 'result') {
    const { result } = toolInvocation;

    if (toolName === 'getWeather') {
      return <Weather weatherAtLocation={result} />;
    }
    if (toolName === 'createDocument') {
      return <DocumentPreview isReadonly={isReadonly} result={result} />;
    }
    if (toolName === 'updateDocument') {
      return <DocumentToolResult type="update" result={result} isReadonly={isReadonly} />;
    }
    if (toolName === 'requestSuggestions') {
      return <DocumentToolResult type="request-suggestions" result={result} isReadonly={isReadonly} />;
    }
    return (
      <pre className="text-[11px] font-mono whitespace-pre-wrap max-w-full overflow-x-auto break-words text-muted-foreground leading-relaxed">
        {result.result}
      </pre>
    );
  }

  // In progress
  if (toolName === 'getWeather') {
    return (
      <div className={cx({ skeleton: true })}>
        <Weather />
      </div>
    );
  }
  if (toolName === 'createDocument') {
    return <DocumentPreview isReadonly={isReadonly} args={args} />;
  }
  if (toolName === 'updateDocument') {
    return <DocumentToolCall type="update" args={args} isReadonly={isReadonly} />;
  }
  if (toolName === 'requestSuggestions') {
    return <DocumentToolCall type="request-suggestions" args={args} isReadonly={isReadonly} />;
  }
  if (toolName === 'legalSearch') {
    return (
      <span className="text-[11px] font-mono text-muted-foreground/60">
        {args.query}
      </span>
    );
  }

  return null;
}
