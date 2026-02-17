import { tool } from 'ai';
import { z } from 'zod';
import { getOrCreateCollection, LEGAL_COLLECTION } from '@/lib/rag/chroma';
import { embedQuery } from '@/lib/rag/embeddings';

export const legalSearch = tool({
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
    try {
      const collection = await getOrCreateCollection(LEGAL_COLLECTION);
      const queryEmbedding = await embedQuery(query);

      const where = industry ? { industry: { $eq: industry } } : undefined;

      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 5,
        where: where as any,
        include: ['documents', 'metadatas', 'distances'],
      });

      if (
        !results.documents ||
        !results.documents[0] ||
        results.documents[0].length === 0
      ) {
        return {
          result:
            'No relevant legal documents found. The knowledge base may not be indexed yet.',
        };
      }

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

      const formatted = sources
        .map(
          (s, i) =>
            `[${i + 1}] ${s.title}\n` +
            `Source: ${s.source} | Type: ${s.document_type} | Industry: ${s.industry}\n` +
            `Date: ${s.date} | Relevance: ${s.relevance_score}\n` +
            `URL: ${s.url}\n` +
            `---\n${s.text}\n`,
        )
        .join('\n');

      return {
        result: `Found ${sources.length} relevant legal documents:\n\n${formatted}`,
      };
    } catch (error) {
      console.error('Legal search error:', error);
      return {
        result:
          'Legal search is currently unavailable. Please ensure ChromaDB is running.',
      };
    }
  },
});
