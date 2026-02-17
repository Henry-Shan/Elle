import type { Collection } from 'chromadb';

const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost';
const CHROMA_PORT = Number(process.env.CHROMA_PORT) || 8000;

let client: any = null;
let ChromaClientClass: any = null;

async function loadChromaClient() {
  if (!ChromaClientClass) {
    const mod = await import('chromadb');
    ChromaClientClass = mod.ChromaClient;
  }
  return ChromaClientClass;
}

export async function getChromaClient() {
  const Client = await loadChromaClient();
  if (!client) {
    client = new Client({ host: CHROMA_HOST, port: CHROMA_PORT });
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
