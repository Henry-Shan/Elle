'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { artifactDefinitions, type ArtifactKind } from './artifact';
import type { Suggestion } from '@/lib/db/schema';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { useGenerationStatus } from '@/hooks/use-generation-status';

export type DataStreamDelta = {
  type:
    | 'text-delta'
    | 'code-delta'
    | 'sheet-delta'
    | 'image-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'kind'
    | 'status';
  content: string | Suggestion;
};

// Module-level index tracking — survives React Strict Mode remounts
const processedIndexMap = new Map<string, number>();

export function resetStreamIndex(id: string) {
  processedIndexMap.delete(id);
}

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const { artifact, setArtifact, setMetadata } = useArtifact();
  const { addStep } = useGenerationStatus();
  const artifactRef = useRef(artifact);
  artifactRef.current = artifact;

  useEffect(() => {
    if (!dataStream?.length) return;

    const lastIdx = processedIndexMap.get(id) ?? -1;
    if (dataStream.length - 1 <= lastIdx) return;

    const newDeltas = dataStream.slice(lastIdx + 1);
    processedIndexMap.set(id, dataStream.length - 1);

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'status') {
        addStep(delta.content as string);
        return;
      }

      const artifactDefinition = artifactDefinitions.find(
        (def) => def.kind === artifactRef.current.kind,
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'id':
            return {
              ...draftArtifact,
              documentId: delta.content as string,
              status: 'streaming',
            };

          case 'title':
            return {
              ...draftArtifact,
              title: delta.content as string,
              status: 'streaming',
            };

          case 'kind':
            return {
              ...draftArtifact,
              kind: delta.content as ArtifactKind,
              status: 'streaming',
            };

          case 'clear':
            return {
              ...draftArtifact,
              content: '',
              status: 'streaming',
            };

          case 'finish':
            return {
              ...draftArtifact,
              status: 'idle',
            };

          default:
            return draftArtifact;
        }
      });
    });
  }, [dataStream, id, setArtifact, setMetadata, addStep]);

  return null;
}
