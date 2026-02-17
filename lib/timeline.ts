import type { ToolInvocation } from 'ai';

export type TimelineStepStatus = 'in_progress' | 'completed';

export interface TimelineStep {
  id: string;
  stepNumber: number;
  type: 'reasoning' | 'tool';
  status: TimelineStepStatus;
  reasoning?: string;
  toolInvocation?: ToolInvocation;
  toolName?: string;
  toolDisplayName?: string;
}

const toolDisplayNames: Record<string, string> = {
  getWeather: 'Get Weather',
  createDocument: 'Create Document',
  updateDocument: 'Update Document',
  requestSuggestions: 'Request Suggestions',
  webSearch: 'Web Search',
  calculator: 'Calculator',
  getDate: 'Get Date',
  legalSearch: 'Legal Search',
};

export function getToolDisplayName(toolName: string): string {
  if (toolDisplayNames[toolName]) {
    return toolDisplayNames[toolName];
  }
  // Convert camelCase to Title Case
  return toolName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function buildTimelineSteps({
  reasoning,
  toolInvocations,
  isLoading,
}: {
  reasoning?: string;
  toolInvocations?: ToolInvocation[];
  isLoading: boolean;
}): TimelineStep[] {
  const steps: TimelineStep[] = [];
  let stepNumber = 1;

  if (reasoning) {
    const hasToolInvocations = toolInvocations && toolInvocations.length > 0;
    const reasoningDone = !isLoading || hasToolInvocations;

    steps.push({
      id: 'reasoning',
      stepNumber,
      type: 'reasoning',
      status: reasoningDone ? 'completed' : 'in_progress',
      reasoning,
    });
    stepNumber++;
  }

  if (toolInvocations) {
    for (const invocation of toolInvocations) {
      const isCompleted = invocation.state === 'result';
      steps.push({
        id: invocation.toolCallId,
        stepNumber,
        type: 'tool',
        status: isCompleted ? 'completed' : 'in_progress',
        toolInvocation: invocation,
        toolName: invocation.toolName,
        toolDisplayName: getToolDisplayName(invocation.toolName),
      });
      stepNumber++;
    }
  }

  return steps;
}
