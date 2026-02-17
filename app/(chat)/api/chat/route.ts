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
import { PDFParse } from "pdf-parse";

async function extractPdfText(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

async function processAttachments(messages: Array<Message>): Promise<Array<Message>> {
  const processed: Array<Message> = [];

  for (const message of messages) {
    const attachments = message.experimental_attachments;
    if (!attachments || attachments.length === 0) {
      processed.push(message);
      continue;
    }

    const pdfTexts: string[] = [];
    const nonPdfAttachments = [];

    for (const attachment of attachments) {
      if (attachment.contentType === "application/pdf" && attachment.url) {
        try {
          const text = await extractPdfText(attachment.url);
          pdfTexts.push(
            `[Attached PDF: ${attachment.name || "document.pdf"}]\n${text}`
          );
        } catch (e) {
          console.error("Failed to extract PDF text:", e);
          pdfTexts.push(
            `[Attached PDF: ${attachment.name || "document.pdf"}] (Failed to extract text)`
          );
        }
      } else {
        nonPdfAttachments.push(attachment);
      }
    }

    if (pdfTexts.length > 0) {
      const pdfContent = pdfTexts.join("\n\n");
      const originalContent =
        typeof message.content === "string" ? message.content : "";
      processed.push({
        ...message,
        content: originalContent
          ? `${originalContent}\n\n${pdfContent}`
          : pdfContent,
        experimental_attachments:
          nonPdfAttachments.length > 0 ? nonPdfAttachments : undefined,
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

    const chat = await getChatById({ id });

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
    return NextResponse.json({ error }, { status: 400 });
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
