import 'dotenv/config';
import { getOrCreateCollection, LEGAL_COLLECTION } from '../lib/rag/chroma';
import { embedTexts } from '../lib/rag/embeddings';
import { chunkText } from '../lib/rag/chunker';

// Agency slugs mapped to industry verticals
const AGENCY_MAPPINGS: {
  slug: string;
  name: string;
  industry: string;
}[] = [
  // Healthcare
  { slug: 'food-and-drug-administration', name: 'FDA', industry: 'healthcare' },
  { slug: 'health-and-human-services-department', name: 'HHS', industry: 'healthcare' },
  { slug: 'centers-for-medicare-medicaid-services', name: 'CMS', industry: 'healthcare' },
  // E-commerce
  { slug: 'federal-trade-commission', name: 'FTC', industry: 'ecommerce' },
  { slug: 'consumer-product-safety-commission', name: 'CPSC', industry: 'ecommerce' },
  // SaaS
  { slug: 'federal-communications-commission', name: 'FCC', industry: 'saas' },
  // EdTech
  { slug: 'education-department', name: 'ED', industry: 'edtech' },
  // Real Estate
  { slug: 'housing-and-urban-development-department', name: 'HUD', industry: 'real_estate' },
  { slug: 'consumer-financial-protection-bureau', name: 'CFPB', industry: 'real_estate' },
  // Travel
  { slug: 'transportation-department', name: 'DOT', industry: 'travel' },
  { slug: 'federal-aviation-administration', name: 'FAA', industry: 'travel' },
  { slug: 'transportation-security-administration', name: 'TSA', industry: 'travel' },
  // Esports
  { slug: 'justice-department', name: 'DOJ', industry: 'esports' },
  { slug: 'financial-crimes-enforcement-network', name: 'FinCEN', industry: 'esports' },
  // General
  { slug: 'labor-department', name: 'DOL', industry: 'general' },
  { slug: 'small-business-administration', name: 'SBA', industry: 'general' },
];

const FR_API_BASE = 'https://www.federalregister.gov/api/v1/documents.json';
const BATCH_SIZE = 50;
const DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface FRDocument {
  document_number: string;
  title: string;
  type: string;
  abstract: string | null;
  body_html_url: string | null;
  html_url: string;
  publication_date: string;
  agencies: { name: string; slug: string }[];
  excerpts: string | null;
  full_text_xml_url: string | null;
}

interface FRResponse {
  count: number;
  results: FRDocument[];
  next_page_url: string | null;
}

function getDateTwoYearsAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 2);
  return date.toISOString().split('T')[0];
}

async function fetchFRDocuments(
  agencySlug: string,
  page = 1,
): Promise<FRResponse> {
  const sinceDate = getDateTwoYearsAgo();

  const params = new URLSearchParams({
    'conditions[agencies][]': agencySlug,
    'conditions[publication_date][gte]': sinceDate,
    per_page: '100',
    page: String(page),
    order: 'relevance',
    'fields[]': [
      'document_number',
      'title',
      'type',
      'abstract',
      'body_html_url',
      'html_url',
      'publication_date',
      'agencies',
      'excerpts',
    ].join(','),
  });

  // Fix: fields[] needs to be sent individually
  const url = new URL(FR_API_BASE);
  url.searchParams.set('conditions[agencies][]', agencySlug);
  url.searchParams.set('conditions[publication_date][gte]', sinceDate);
  url.searchParams.set('per_page', '100');
  url.searchParams.set('page', String(page));
  url.searchParams.set('order', 'relevance');
  for (const field of [
    'document_number',
    'title',
    'type',
    'abstract',
    'body_html_url',
    'html_url',
    'publication_date',
    'agencies',
    'excerpts',
  ]) {
    url.searchParams.append('fields[]', field);
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Federal Register API error ${response.status}: ${response.statusText}`,
    );
  }

  return response.json() as Promise<FRResponse>;
}

function extractText(doc: FRDocument): string {
  const parts: string[] = [];

  if (doc.title) parts.push(doc.title);
  if (doc.abstract) parts.push(doc.abstract);
  if (doc.excerpts) {
    parts.push(
      doc.excerpts
        .replace(/<[^>]*>/g, '')
        .replace(/&[a-z]+;/g, ' ')
        .trim(),
    );
  }

  return parts.join('\n\n');
}

async function ingestFederalRegister() {
  console.log('=== Federal Register Ingestion Starting ===\n');
  const collection = await getOrCreateCollection(LEGAL_COLLECTION);

  let totalChunks = 0;

  for (const agency of AGENCY_MAPPINGS) {
    console.log(`\nProcessing ${agency.name} (${agency.slug}) [${agency.industry}]`);

    let page = 1;
    let docsProcessed = 0;

    while (page <= 10) {
      // Max 10 pages per agency
      try {
        const data = await fetchFRDocuments(agency.slug, page);

        if (!data.results || data.results.length === 0) break;

        const ids: string[] = [];
        const allEmbeddings: number[][] = [];
        const metadatas: Record<string, string>[] = [];
        const documents: string[] = [];

        for (const doc of data.results) {
          const text = extractText(doc);
          if (!text || text.length < 100) continue;

          const docType =
            doc.type === 'Rule'
              ? 'regulation'
              : doc.type === 'Proposed Rule'
                ? 'proposed_regulation'
                : doc.type === 'Notice'
                  ? 'notice'
                  : 'guidance';

          const baseMetadata: Record<string, string> = {
            source: 'federal_register',
            title: doc.title || `${agency.name} Document`,
            jurisdiction: 'US-Federal',
            industry: agency.industry,
            document_type: docType,
            cfr_title: '',
            date: doc.publication_date || new Date().toISOString().split('T')[0],
            url: doc.html_url || 'https://www.federalregister.gov',
            agency: agency.name,
            document_number: doc.document_number || '',
          };

          const chunks = chunkText(text, baseMetadata);

          for (const chunk of chunks) {
            const id = `fr-${agency.slug}-${doc.document_number || page}-${ids.length}`;
            ids.push(id);
            metadatas.push(chunk.metadata);
            documents.push(chunk.text);
          }
        }

        if (ids.length > 0) {
          for (let i = 0; i < ids.length; i += BATCH_SIZE) {
            const batchIds = ids.slice(i, i + BATCH_SIZE);
            const batchDocs = documents.slice(i, i + BATCH_SIZE);
            const batchMeta = metadatas.slice(i, i + BATCH_SIZE);
            const batchEmbeddings = await embedTexts(batchDocs);

            await collection.upsert({
              ids: batchIds,
              embeddings: batchEmbeddings,
              metadatas: batchMeta,
              documents: batchDocs,
            });
          }

          totalChunks += ids.length;
          console.log(
            `  Page ${page}: Indexed ${ids.length} chunks from ${data.results.length} documents`,
          );
        }

        docsProcessed += data.results.length;
        if (!data.next_page_url || docsProcessed >= data.count) break;

        page++;
        await sleep(DELAY_MS);
      } catch (error) {
        console.error(
          `  Error fetching page ${page}:`,
          error instanceof Error ? error.message : error,
        );
        break;
      }
    }

    console.log(`  ${agency.name} done: ${docsProcessed} docs processed`);
  }

  console.log(
    `\n=== Federal Register Ingestion Complete: ${totalChunks} total chunks ===`,
  );
  return totalChunks;
}

export { ingestFederalRegister };

// Run directly if this is the entry script
const isDirectRun =
  process.argv[1]?.endsWith('ingest-federal-register.ts') ||
  process.argv[1]?.endsWith('ingest-federal-register.js');

if (isDirectRun) {
  ingestFederalRegister()
    .then((count) => {
      console.log(`\nDone. Total chunks indexed: ${count}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
