import { type Message, createDataStreamResponse } from "ai";
import { auth } from "@/app/(auth)/auth";
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from "@/lib/db/queries";
import { getMostRecentUserMessage } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { NextResponse } from "next/server";
import ExecuteChatWorkflow from "@/lib/workflows/execute-chat";
import { chunkText } from "@/lib/rag/chunker";
import { embedTexts, embedQuery } from "@/lib/rag/embeddings";
import { getOrCreateCollection } from "@/lib/rag/chroma";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

// Files under this char count (~2K tokens) go inline; larger ones get RAG-indexed
const INLINE_THRESHOLD = 8000;

async function extractFileText(
  url: string,
  contentType: string,
  name: string
): Promise<string> {
  let buffer: ArrayBuffer;

  if (url.startsWith("data:")) {
    // Decode base64 data URL directly
    const base64 = url.split(",")[1];
    const decoded = Buffer.from(base64, "base64");
    buffer = decoded.buffer.slice(
      decoded.byteOffset,
      decoded.byteOffset + decoded.byteLength
    );
  } else {
    // Fallback: fetch from HTTP URL
    const response = await fetch(url);
    buffer = await response.arrayBuffer();
  }

  if (contentType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return `[Attached file: ${name}]\n${result.text}`;
  }

  // Plain text, CSV, JSON, markdown, code files, etc.
  const text = new TextDecoder().decode(buffer);
  return `[Attached file: ${name}]\n${text}`;
}

// ---------------------------------------------------------------------------
// RAG: index large files into ChromaDB
// ---------------------------------------------------------------------------

function fileCollectionName(chatId: string): string {
  // ChromaDB collection names: 3-63 chars, alphanumeric + underscores/hyphens
  return `file-uploads-${chatId}`.slice(0, 63);
}

async function indexFileInChroma(
  chatId: string,
  fileName: string,
  fullText: string
): Promise<number> {
  const chunks = chunkText(fullText, {
    source: "user-upload",
    file_name: fileName,
  });

  if (chunks.length === 0) return 0;

  const texts = chunks.map((c) => c.text);
  const embeddings = await embedTexts(texts);

  const collection = await getOrCreateCollection(fileCollectionName(chatId));

  // Upsert in batches of 100 (ChromaDB limit)
  const BATCH = 100;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batchChunks = chunks.slice(i, i + BATCH);
    const batchEmbeddings = embeddings.slice(i, i + BATCH);
    await collection.add({
      ids: batchChunks.map((_, j) => `${fileName}-chunk-${i + j}`),
      documents: batchChunks.map((c) => c.text),
      embeddings: batchEmbeddings,
      metadatas: batchChunks.map((c) => c.metadata),
    });
  }

  console.log(`[RAG] Indexed ${chunks.length} chunks for "${fileName}" into collection "${fileCollectionName(chatId)}"`);
  return chunks.length;
}

async function retrieveFileContext(
  chatId: string,
  userQuery: string,
  topK = 10
): Promise<string | null> {
  try {
    const collection = await getOrCreateCollection(fileCollectionName(chatId));
    const count = await collection.count();
    if (count === 0) return null;

    const queryEmbedding = await embedQuery(userQuery);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: Math.min(topK, count),
      include: ["documents", "metadatas", "distances"],
    });

    if (!results.documents?.[0] || results.documents[0].length === 0) {
      return null;
    }

    const contextParts: string[] = [];
    for (let i = 0; i < results.documents[0].length; i++) {
      const doc = results.documents[0][i];
      const meta = results.metadatas?.[0]?.[i];
      const fileName = (meta as any)?.file_name || "file";
      const chunkIdx = (meta as any)?.chunk_index || i;
      contextParts.push(`[From ${fileName}, chunk ${chunkIdx}]\n${doc}`);
    }

    return `--- Retrieved file context (most relevant excerpts) ---\n\n${contextParts.join("\n\n")}\n\n--- End of retrieved file context ---`;
  } catch (e) {
    console.error("[RAG] Failed to retrieve file context:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Process attachments: small → inline, large → RAG index
// ---------------------------------------------------------------------------

async function processAttachments(
  messages: Array<Message>,
  chatId: string
): Promise<Array<Message>> {
  const processed: Array<Message> = [];

  for (const message of messages) {
    const attachments = message.experimental_attachments;
    if (!attachments || attachments.length === 0) {
      processed.push(message);
      continue;
    }

    const extractedTexts: string[] = [];
    const passthroughAttachments = [];

    for (const attachment of attachments) {
      const ct = attachment.contentType || "";

      // Images pass through as attachments (model supports vision)
      if (IMAGE_TYPES.includes(ct)) {
        passthroughAttachments.push(attachment);
        continue;
      }

      // Everything else: extract text
      if (attachment.url) {
        try {
          const text = await extractFileText(
            attachment.url,
            ct,
            attachment.name || "file"
          );

          // Small file → inject inline
          if (text.length <= INLINE_THRESHOLD) {
            extractedTexts.push(text);
          } else {
            // Large file → index in ChromaDB for RAG retrieval
            const numChunks = await indexFileInChroma(
              chatId,
              attachment.name || "file",
              text
            );
            extractedTexts.push(
              `[Attached file: ${attachment.name || "file"} — indexed for retrieval, ${numChunks} chunks. The AI will search this file to answer your questions.]`
            );
          }
        } catch (e) {
          console.error("Failed to extract file text:", e);
          extractedTexts.push(
            `[Attached file: ${attachment.name || "file"}] (Failed to read file)`
          );
        }
      }
    }

    if (extractedTexts.length > 0) {
      const fileContent = extractedTexts.join("\n\n");
      const originalContent =
        typeof message.content === "string" ? message.content : "";
      processed.push({
        ...message,
        content: originalContent
          ? `${originalContent}\n\n${fileContent}`
          : fileContent,
        experimental_attachments:
          passthroughAttachments.length > 0
            ? passthroughAttachments
            : undefined,
      });
    } else {
      processed.push(message);
    }
  }

  return processed;
}

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<Message>;
      selectedChatModel: string;
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response("No user message found", { status: 400 });
    }

    let chat: Awaited<ReturnType<typeof getChatById>> | null = null;
    try {
      chat = await getChatById({ id });
    } catch {
      // DB may be temporarily unavailable — proceed to create chat
    }

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    await saveMessages({
      messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
    });

    const processedMessages = await processAttachments(messages, id);

    // Retrieve relevant file chunks (if any were RAG-indexed)
    const userQuery =
      typeof userMessage.content === "string"
        ? userMessage.content
        : "summarize the uploaded file";
    const fileContext = await retrieveFileContext(id, userQuery);

    // If we have RAG context, inject it into the last user message's content
    // (avoids adding extra messages which can break DeepSeek reasoning mode)
    let finalMessages = processedMessages;
    if (fileContext) {
      finalMessages = processedMessages.map((msg) => {
        if (msg.id === userMessage.id && msg.role === "user") {
          const existingContent =
            typeof msg.content === "string" ? msg.content : "";
          return {
            ...msg,
            content: `${fileContext}\n\n${existingContent}`,
          };
        }
        return msg;
      });
    }

    // Strip reasoning parts from assistant messages to avoid DeepSeek
    // "Missing reasoning_content" errors on follow-up turns.
    // The model regenerates reasoning each turn, so history doesn't need it.
    finalMessages = finalMessages.map((msg) => {
      if (msg.role !== "assistant") return msg;
      // Remove the top-level reasoning field
      const { reasoning, ...rest } = msg as any;
      // Also strip reasoning parts from content arrays
      if (Array.isArray(rest.content)) {
        rest.content = rest.content.filter(
          (part: any) => part.type !== "reasoning"
        );
      }
      return rest;
    });

    return createDataStreamResponse({
      execute: async (dataStream) => {
        const result = await ExecuteChatWorkflow.run({
          id,
          messages: finalMessages,
          selectedChatModel,
          dataStream,
          session,
          saveMessages,
        });

        console.log("result from route", result);
        console.log("result type from route", typeof result.consumeStream());
        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        return `Oops, an error occured! ${error}`;
      },
    });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error: unknown) {
    console.error("Error deleting chat:", error);
    return new Response(
      error instanceof Error
        ? `Error: ${error.message}`
        : "An error occurred while processing your request",
      { status: 500 }
    );
  }
}
