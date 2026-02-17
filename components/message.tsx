'use client';

import type { ChatRequestOptions, Message } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useEffect, useRef } from 'react';
import type { Vote } from '@/lib/db/schema';
import { PencilEditIcon, SparklesIcon, CheckCircleFillIcon, LoaderIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { ThoughtProcessTimeline } from './thought-process-timeline';

const ghostPhrases = [
  'Searching knowledge base',
  'Analyzing legal precedents',
  'Cross-referencing statutes',
  'Reviewing compliance guidelines',
  'Parsing regulatory frameworks',
  'Consulting case law databases',
  'Evaluating risk factors',
  'Scanning contract clauses',
  'Retrieving relevant documents',
  'Mapping jurisdictional requirements',
  'Assessing liability exposure',
  'Reviewing industry standards',
  'Checking regulatory updates',
  'Synthesizing legal opinions',
  'Verifying statutory references',
  'Examining dispute history',
  'Drafting initial analysis',
  'Correlating compliance data',
  'Reviewing enforcement actions',
  'Formulating recommendations',
];

const GhostTaskBlock = ({ isLoading }: { isLoading: boolean }) => {
  const [tasks, setTasks] = useState<string[]>([]);
  const availableRef = useRef<string[]>([...ghostPhrases]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!isLoading && tasks.length > 0) {
      setFinished(true);
      return;
    }
    if (!isLoading) return;

    const pickNext = () => {
      if (availableRef.current.length === 0) {
        availableRef.current = [...ghostPhrases];
      }
      const pool = availableRef.current;
      const idx = Math.floor(Math.random() * pool.length);
      const picked = pool[idx];
      pool.splice(idx, 1);
      setTasks((t) => [...t, picked]);
    };

    pickNext();
    const id = setInterval(pickNext, 2500);
    return () => clearInterval(id);
  }, [isLoading]);

  if (tasks.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <AnimatePresence>
        {tasks.map((task, i) => {
          const isLatest = i === tasks.length - 1;
          const isDone = finished || !isLatest;
          return (
            <motion.div
              key={`ghost-${task}`}
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {isDone ? (
                <span className="text-emerald-500 shrink-0">
                  <CheckCircleFillIcon size={12} />
                </span>
              ) : (
                <span className="animate-spin text-muted-foreground shrink-0">
                  <LoaderIcon size={12} />
                </span>
              )}
              <span
                className={cn('text-sm', {
                  'text-muted-foreground': isDone,
                  'text-foreground font-medium': !isDone,
                })}
              >
                {task}{!isDone ? '...' : ''}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  index,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
  index: number;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background mt-1">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full">
            {message.role === 'assistant' && (
              <GhostTaskBlock isLoading={isLoading} />
            )}

            {message.experimental_attachments && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {(message.reasoning ||
              (message.toolInvocations &&
                message.toolInvocations.length > 0)) && (
              <ThoughtProcessTimeline
                reasoning={message.reasoning}
                toolInvocations={message.toolInvocations}
                isLoading={isLoading}
                isReadonly={isReadonly}
              />
            )}

            {(message.content || message.reasoning) && mode === 'view' &&
              !(message.role === 'assistant' && isLoading) && (
              <motion.div
                data-testid="message-content"
                className="flex flex-row gap-2 items-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {message.role === 'user' && !isReadonly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-testid={`message-edit`}
                        variant="ghost"
                        className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100 mt-4"
                        onClick={() => {
                          setMode('edit');
                        }}
                      >
                        <PencilEditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit message</TooltipContent>
                  </Tooltip>
                )}

                <div
                  className={cn('flex flex-col gap-4 [&>*:first-child]:mt-0', {
                    'bg-primary text-primary-foreground px-3 py-2 rounded-xl [&>*:last-child]:mb-0':
                      message.role === 'user',
                  })}
                >
                  <Markdown>{message.content as string}</Markdown>
                </div>
              </motion.div>
            )}

            {message.content && mode === 'edit' && (
              <div className="flex flex-row gap-2 items-start">
                <div className="size-8" />

                <MessageEditor
                  key={message.id}
                  message={message}
                  setMode={setMode}
                  setMessages={setMessages}
                  reload={reload}
                />
              </div>
            )}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.reasoning !== nextProps.message.reasoning)
      return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    )
      return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.3 } }}
      data-role={role}
    >
      <div className="flex gap-4 w-full">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          >
            <SparklesIcon size={14} />
          </motion.div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm font-medium">Thinking...</span>
        </div>
      </div>
    </motion.div>
  );
};
