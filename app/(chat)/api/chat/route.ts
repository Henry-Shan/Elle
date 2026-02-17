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

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

async function extractFileText(
  url: string,
  contentType: string,
  name: string
): Promise<string> {
  const response = await fetch(url);

  if (contentType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const buffer = await response.arrayBuffer();
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return `[Attached file: ${name}]\n${result.text}`;
  }

  // Plain text, CSV, JSON, markdown, code files, etc.
  const text = await response.text();
  return `[Attached file: ${name}]\n${text}`;
}

async function processAttachments(
  messages: Array<Message>
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

      // Images pass through as attachments (DeepSeek supports vision)
      if (IMAGE_TYPES.includes(ct)) {
        passthroughAttachments.push(attachment);
        continue;
      }

      // Everything else: extract text and inject into message
      if (attachment.url) {
        try {
          const text = await extractFileText(
            attachment.url,
            ct,
            attachment.name || "file"
          );
          extractedTexts.push(text);
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

    const processedMessages = await processAttachments(messages);

    return createDataStreamResponse({
      execute: async (dataStream) => {
        const result = await ExecuteChatWorkflow.run({
          id,
          messages: processedMessages,
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
