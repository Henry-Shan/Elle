'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimelineStep } from '@/lib/timeline';
import type { StatusPhase } from '@/hooks/use-generation-status';
import {
  ChevronDownIcon,
  LoaderIcon,
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

// ---------------------------------------------------------------------------
// Phase block — groups multiple status sub-steps under a single header
// ---------------------------------------------------------------------------

export function StatusPhaseItem({ phase }: { phase: StatusPhase }) {
  const [collapsed, setCollapsed] = useState(false);
  const latestStep = phase.steps[phase.steps.length - 1];

  return (
    <motion.div
      className="py-1"
      animate={{ opacity: phase.isActive ? 1 : 0.45 }}
      transition={{ duration: 0.5 }}
    >
      {/* Phase header */}
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left group cursor-pointer"
        onClick={() => setCollapsed((c) => !c)}
      >
        {phase.isActive && (
          <span className="text-muted-foreground animate-spin shrink-0">
            <LoaderIcon size={14} />
          </span>
        )}
        <span className="text-sm font-medium">{phase.name}</span>
        {phase.isActive && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Running
          </span>
        )}
        {!phase.isActive && phase.steps.length > 1 && (
          <span className="text-xs text-muted-foreground">
            {phase.steps.length} steps
          </span>
        )}
        <ChevronDownIcon
          size={14}
          className={cx(
            'ml-auto transition-transform duration-200 text-muted-foreground opacity-0 group-hover:opacity-100',
            !collapsed ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>

      {/* Sub-steps */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="sub-steps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="ml-5 mt-1 flex flex-col gap-0.5 border-l border-border/50 pl-3">
              {phase.steps.map((step, i) => {
                const isCurrent = phase.isActive && i === phase.steps.length - 1;
                return (
                  <motion.div
                    key={`${phase.name}-${i}`}
                    className="flex items-center gap-1.5"
                    animate={{ opacity: isCurrent ? 1 : 0.5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isCurrent && (
                      <span className="text-muted-foreground animate-spin shrink-0">
                        <LoaderIcon size={10} />
                      </span>
                    )}
                    <span className={cx('text-xs text-muted-foreground', { 'font-medium': isCurrent })}>
                      {step}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed summary — show latest step inline */}
      {collapsed && latestStep && (
        <div className="ml-5 mt-0.5">
          <span className="text-xs text-muted-foreground">{latestStep}</span>
        </div>
      )}
    </motion.div>
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
      className="py-1"
      animate={{ opacity: isCompleted ? 0.45 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <button
        type="button"
        className="flex items-center gap-2 cursor-pointer w-full text-left group"
        onClick={toggleFromTitle}
      >
        {!isCompleted && (
          <span className="text-muted-foreground animate-spin shrink-0">
            <LoaderIcon size={14} />
          </span>
        )}
        {ToolIcon && (
          <span className="text-muted-foreground">
            <ToolIcon size={14} />
          </span>
        )}
        <span className="text-sm font-medium">
          {step.type === 'reasoning'
            ? 'Reasoning'
            : step.toolDisplayName || step.toolName}
        </span>
        {!isCompleted && step.type === 'tool' && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Running
          </span>
        )}
        {hasContent && (
          <ChevronDownIcon
            size={14}
            className={cx(
              'ml-auto transition-transform duration-200 text-muted-foreground opacity-0 group-hover:opacity-100',
              view !== 'collapsed' ? 'rotate-0' : '-rotate-90',
            )}
          />
        )}
      </button>

      {/* Content area */}
      {hasContent && view !== 'collapsed' && (
        <AnimatePresence initial={false}>
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-2 ml-5 pl-3 border-l border-border/50">
              {step.type === 'reasoning' && step.reasoning && (
                <ContentPreview
                  isExpanded={view === 'expanded'}
                  onExpand={() => setView('expanded')}
                >
                  <div className="text-zinc-600 dark:text-zinc-400 flex flex-col gap-4">
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
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Content preview — clips to ~3 lines with fade, click to expand
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
      <div className="max-h-[4.5em] overflow-hidden leading-[1.5em]">
        {children}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      <span className="text-xs text-muted-foreground mt-1 inline-block hover:underline">
        Show more
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
      return (
        <DocumentToolResult type="update" result={result} isReadonly={isReadonly} />
      );
    }
    if (toolName === 'requestSuggestions') {
      return (
        <DocumentToolResult type="request-suggestions" result={result} isReadonly={isReadonly} />
      );
    }
    if (toolName === 'legalSearch') {
      return (
        <pre className="text-xs whitespace-pre-wrap max-w-full overflow-x-auto break-words text-muted-foreground">
          {result.result}
        </pre>
      );
    }
    return (
      <pre className="text-xs whitespace-pre-wrap max-w-full overflow-x-auto break-words text-muted-foreground">
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
      <span className="text-sm text-muted-foreground">
        Searching for: {args.query}
      </span>
    );
  }

  return null;
}
