'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimelineStep } from '@/lib/timeline';
import {
  CheckCircleFillIcon,
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
};

function getToolIcon(toolName?: string) {
  if (!toolName) return null;
  return toolIconMap[toolName] || null;
}

const collapseVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
  },
};

export function TimelineStepItem({
  step,
  isReadonly,
}: {
  step: TimelineStep;
  isReadonly: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(step.status === 'in_progress');

  const isCompleted = step.status === 'completed';
  const ToolIcon = step.type === 'tool' ? getToolIcon(step.toolName) : null;

  return (
    <div className="relative pl-8 pb-4 last:pb-0">
      {/* Step circle */}
      <div className="absolute -left-[11px] top-0.5 flex items-center justify-center size-[22px] rounded-full bg-background">
        {isCompleted ? (
          <span className="text-emerald-500">
            <CheckCircleFillIcon size={18} />
          </span>
        ) : (
          <span className="text-muted-foreground animate-spin">
            <LoaderIcon size={18} />
          </span>
        )}
      </div>

      {/* Step header */}
      <button
        type="button"
        className="flex items-center gap-2 cursor-pointer w-full text-left group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
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
        {step.type === 'tool' && (
          <span
            className={cx(
              'text-[10px] font-medium px-2 py-0.5 rounded-full',
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {isCompleted ? 'Done' : 'Running'}
          </span>
        )}
        <ChevronDownIcon
          size={14}
          className={cx(
            'ml-auto transition-transform duration-200 text-muted-foreground opacity-0 group-hover:opacity-100',
            isExpanded ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={collapseVariants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-2">
              {step.type === 'reasoning' && step.reasoning && (
                <div className="pl-4 text-zinc-600 dark:text-zinc-400 border-l flex flex-col gap-4">
                  <Markdown>{step.reasoning}</Markdown>
                </div>
              )}

              {step.type === 'tool' && step.toolInvocation && (
                <ToolContent
                  toolInvocation={step.toolInvocation}
                  isReadonly={isReadonly}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
        <DocumentToolResult
          type="update"
          result={result}
          isReadonly={isReadonly}
        />
      );
    }
    if (toolName === 'requestSuggestions') {
      return (
        <DocumentToolResult
          type="request-suggestions"
          result={result}
          isReadonly={isReadonly}
        />
      );
    }
    return (
      <div>
        <div className="text-sm font-medium mb-1">Tool: {toolName}</div>
        <pre className="text-xs whitespace-pre-wrap max-w-full overflow-x-auto break-words">
          {result.result}
        </pre>
      </div>
    );
  }

  // Call state (in progress)
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
    return (
      <DocumentToolCall type="update" args={args} isReadonly={isReadonly} />
    );
  }
  if (toolName === 'requestSuggestions') {
    return (
      <DocumentToolCall
        type="request-suggestions"
        args={args}
        isReadonly={isReadonly}
      />
    );
  }

  return null;
}
