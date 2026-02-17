import { tool, type DataStreamWriter } from 'ai';
import { z } from 'zod';
import { getOrCreateCollection, LEGAL_COLLECTION } from '@/lib/rag/chroma';
import { embedQuery } from '@/lib/rag/embeddings';
import { deepseek } from '@ai-sdk/deepseek';
import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

async function legalWebFallback(query: string, industry?: string): Promise<string> {
  const provider = process.env.AI_PROVIDER || 'deepseek';
  const model = provider === 'mistral'
    ? mistral('mistral-large-latest')
    : deepseek('deepseek-chat');

  const industryClause = industry ? ` Focus on the ${industry} industry.` : '';

  const { text } = await generateText({
    model,
    system: `You are a legal research assistant. Given a legal query, provide a thorough, well-sourced response covering relevant statutes, regulations, case law, and compliance guidance. Structure your response as numbered sources with titles, legal citations, and summaries. Include real, verifiable legal references (e.g. specific CFR sections, USC titles, case names).${industryClause}`,
    prompt: `Research the following legal topic and provide 3-5 authoritative sources with citations:\n\n"${query}"`,
  });

  return text;
}

export const legalSearch = ({ dataStream }: { dataStream: DataStreamWriter }) =>
  tool({
    description:
      'Search the legal knowledge base for statutes, regulations, case law, and compliance guidance relevant to the user query.',
    parameters: z.object({
      query: z
        .string()
        .describe('The legal question or topic to search for'),
      industry: z
        .string()
        .optional()
        .describe(
          'Industry filter: healthcare, ecommerce, saas, edtech, real_estate, travel, esports',
        ),
    }),
    execute: async ({ query, industry }) => {
      let ragResults: string | null = null;

      // Step 1: Try ChromaDB RAG search
      try {
        dataStream.writeData({ type: 'status', content: 'Connecting to knowledge base...' });
        const collection = await getOrCreateCollection(LEGAL_COLLECTION);
        const docCount = await collection.count();

        if (docCount > 0) {
          dataStream.writeData({ type: 'status', content: 'Embedding your query...' });
          const queryEmbedding = await embedQuery(query);

          const where = industry ? { industry: { $eq: industry } } : undefined;

          dataStream.writeData({ type: 'status', content: `Searching ${docCount.toLocaleString()} legal documents...` });
          const results = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: 5,
            where: where as any,
            include: ['documents', 'metadatas', 'distances'],
          });

          if (
            results.documents?.[0] &&
            results.documents[0].length > 0
          ) {
            const count = results.documents[0].length;
            dataStream.writeData({ type: 'status', content: `Found ${count} relevant documents` });

            const sources = results.documents[0].map((doc, i) => {
              const meta = results.metadatas?.[0]?.[i] || {};
              const distance = results.distances?.[0]?.[i];
              return {
                text: doc,
                source: meta.source || 'unknown',
                title: meta.title || 'Untitled',
                industry: meta.industry || 'general',
                document_type: meta.document_type || 'unknown',
                url: meta.url || '',
                date: meta.date || '',
                relevance_score: distance != null ? (1 - distance).toFixed(3) : 'N/A',
              };
            });

            ragResults = sources
              .map(
                (s, i) =>
                  `[${i + 1}] ${s.title}\n` +
                  `Source: ${s.source} | Type: ${s.document_type} | Industry: ${s.industry}\n` +
                  `Date: ${s.date} | Relevance: ${s.relevance_score}\n` +
                  `URL: ${s.url}\n` +
                  `---\n${s.text}\n`,
              )
              .join('\n');
          }
        } else {
          dataStream.writeData({ type: 'status', content: 'Knowledge base is empty — will search online' });
        }
      } catch (error) {
        console.error('Legal search ChromaDB error:', error);
        dataStream.writeData({ type: 'status', content: 'Knowledge base unavailable — will search online' });
      }

      // Step 2: Always run web research for supplementary sources
      let webResults: string | null = null;
      try {
        dataStream.writeData({ type: 'status', content: 'Researching legal sources online...' });
        webResults = await legalWebFallback(query, industry);
      } catch (error) {
        console.error('Legal web search error:', error);
        dataStream.writeData({ type: 'status', content: 'Online research unavailable' });
      }

      // Step 3: Combine and return
      dataStream.writeData({ type: 'status', content: 'Analyzing legal context...' });

      const parts: string[] = [];

      if (ragResults) {
        parts.push(`=== Knowledge Base Results ===\n\n${ragResults}`);
      }
      if (webResults) {
        parts.push(`=== Online Legal Research ===\n\n${webResults}`);
      }

      dataStream.writeData({ type: 'status', content: '' });

      if (parts.length === 0) {
        return {
          result:
            `No sources could be retrieved for "${query}". ` +
            `Please answer using your general legal knowledge and clearly note that no verified sources were found.`,
        };
      }

      return {
        result: parts.join('\n\n'),
      };
    },
  });
