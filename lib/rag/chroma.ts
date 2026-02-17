import { ChromaClient, type Collection } from 'chromadb';

const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost';
const CHROMA_PORT = Number(process.env.CHROMA_PORT) || 8000;

let client: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
  if (!client) {
    client = new ChromaClient({ host: CHROMA_HOST, port: CHROMA_PORT });
  }
  return client;
}

export async function getOrCreateCollection(
  name: string,
): Promise<Collection> {
  const chromaClient = getChromaClient();
  return chromaClient.getOrCreateCollection({ name, embeddingFunction: null });
}

export const LEGAL_COLLECTION = 'legal-documents';
