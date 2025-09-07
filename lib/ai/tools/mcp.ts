import { tool } from 'ai';
import { z } from 'zod';
import McpWorkflow from '@/lib/workflows/mcp';

export const mcp = 
  tool({
    description: 'A simple MCP tool that echoes your message.',
    parameters: z.object({
      message: z.string().describe('The message to echo.'),
    }),
    execute: async (params) => {
      try {
        return McpWorkflow.run(params);
      } catch (error) {
        console.error('Error in MCP tool:', error);
        return { response: 'Error in MCP tool' };
      }
    },
  }); 