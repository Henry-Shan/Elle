import { Artifact } from '@/components/create-artifact';
import { DiffView } from '@/components/diffview';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { Editor } from '@/components/text-editor';
import {
  ClockRewind,
  CopyIcon,
  DownloadIcon,
  MessageIcon,
  PenIcon,
  RedoIcon,
  UndoIcon,
} from '@/components/icons';
import type { Suggestion } from '@/lib/db/schema';
import { toast } from 'sonner';
import { marked } from 'marked';
import { getSuggestions } from '../actions';

interface TextArtifactMetadata {
  suggestions: Array<Suggestion>;
}

export const textArtifact = new Artifact<'text', TextArtifactMetadata>({
  kind: 'text',
  description: 'Useful for text content, like drafting essays and emails.',
  initialize: async ({ documentId, setMetadata }) => {
    const suggestions = await getSuggestions({ documentId });

    setMetadata({
      suggestions,
    });
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'suggestion') {
      setMetadata((metadata) => {
        return {
          suggestions: [
            ...metadata.suggestions,
            streamPart.content as Suggestion,
          ],
        };
      });
    }

    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: draftArtifact.content + (streamPart.content as string),
          isVisible: draftArtifact.isVisible,
          status: 'streaming',
        };
      });
    }
  },
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
  }) => {
    if (isLoading) {
      return <DocumentSkeleton artifactKind="text" />;
    }

    if (mode === 'diff') {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);

      return <DiffView oldContent={oldContent} newContent={newContent} />;
    }

    return (
      <>
        <div className="flex flex-row py-8 md:py-12 md:px-16 px-6">
          <Editor
            content={content}
            suggestions={metadata ? metadata.suggestions : []}
            isCurrentVersion={isCurrentVersion}
            currentVersionIndex={currentVersionIndex}
            status={status}
            onSaveContent={onSaveContent}
          />

          {metadata?.suggestions && metadata.suggestions.length > 0 ? (
            <div className="md:hidden h-dvh w-12 shrink-0" />
          ) : null}
        </div>
      </>
    );
  },
  actions: [
    {
      icon: <ClockRewind size={18} />,
      description: 'View changes',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('toggle');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
    {
      icon: <DownloadIcon size={18} />,
      description: 'Export as PDF',
      onClick: ({ content }) => {
        const html = marked.parse(content) as string;
        // Extract title from the first H1 heading in the markdown content
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const docTitle = titleMatch ? titleMatch[1].trim() : 'Legal Document';

        const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${docTitle}</title>
<style>
  @page { margin: 1in; }
  body { font-family: Georgia, "Times New Roman", serif; font-size: 12pt; line-height: 1.8; color: #1a1a1a; max-width: 100%; padding: 0 1in; }
  h1 { font-size: 1.6em; font-weight: 700; border-bottom: 1px solid #ccc; padding-bottom: 0.4rem; margin-top: 1.5em; }
  h2 { font-size: 1.3em; font-weight: 700; color: #2563eb; margin-top: 1.5em; }
  h3 { font-size: 1.1em; font-weight: 600; margin-top: 1.2em; }
  blockquote { border-left: 3px solid #2563eb; background: #eff6ff; padding: 0.6rem 1rem; margin: 1rem 0; font-family: monospace; font-size: 0.9em; border-radius: 0 4px 4px 0; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; page-break-inside: avoid; }
  th { background: #f3f4f6; font-weight: 600; border: 1px solid #d1d5db; padding: 0.4rem 0.6rem; text-align: left; }
  td { border: 1px solid #d1d5db; padding: 0.4rem 0.6rem; }
  tr:nth-child(even) td { background: #f9fafb; }
  h1, h2, h3 { page-break-after: avoid; }
  a { color: #2563eb; text-decoration: underline; }
  @media print { body { padding: 0; margin: 0; } }
</style>
</head><body>${html}</body></html>`;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        const printWindow = window.open(blobUrl, '_blank');
        if (!printWindow) {
          URL.revokeObjectURL(blobUrl);
          toast.error('Please allow pop-ups to export PDF.');
          return;
        }
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(blobUrl);
        };
      },
    },
  ],
  toolbar: [
    {
      icon: <PenIcon />,
      description: 'Add final polish',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content:
            'Please add final polish and check for grammar, add section titles for better structure, and ensure everything reads smoothly.',
        });
      },
    },
    {
      icon: <MessageIcon />,
      description: 'Request suggestions',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content:
            'Please add suggestions you have that could improve the writing.',
        });
      },
    },
  ],
});
