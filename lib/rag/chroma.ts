import type { Collection } from 'chromadb';

const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost';
const CHROMA_PORT = Number(process.env.CHROMA_PORT) || 8000;
const CHROMA_API_KEY = process.env.CHROMA_API_KEY;
const CHROMA_TENANT = process.env.CHROMA_TENANT;
const CHROMA_DATABASE = process.env.CHROMA_DATABASE;

let client: any = null;
let ChromaClientClass: any = null;
let CloudClientClass: any = null;

async function loadChromaClient() {
  if (!ChromaClientClass || !CloudClientClass) {
    const mod = await import('chromadb');
    ChromaClientClass = mod.ChromaClient;
    CloudClientClass = mod.CloudClient;
  }
  return { ChromaClientClass, CloudClientClass };
}

export async function getChromaClient() {
  const { ChromaClientClass: Client, CloudClientClass: CloudClient } =
    await loadChromaClient();
  if (!client) {
    if (CHROMA_API_KEY && CHROMA_TENANT && CHROMA_DATABASE) {
      // Chroma Cloud — works on Vercel
      client = new CloudClient({
        apiKey: CHROMA_API_KEY,
        tenant: CHROMA_TENANT,
        database: CHROMA_DATABASE,
      });
    } else {
      // Local server (run `pnpm chroma` to start)
      client = new Client({ host: CHROMA_HOST, port: CHROMA_PORT });
    }
  }
  return client;
}

export async function getOrCreateCollection(
  name: string,
): Promise<Collection> {
  const chromaClient = await getChromaClient();
  return chromaClient.getOrCreateCollection({ name, embeddingFunction: null });
}

export const LEGAL_COLLECTION = 'legal-documents';
