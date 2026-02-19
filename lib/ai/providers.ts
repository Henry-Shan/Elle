import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { mistral } from "@ai-sdk/mistral";

const provider = process.env.AI_PROVIDER || "deepseek";

// Standard DeepSeek provider (base models, no reasoning_content fix needed)
const deepseek = createDeepSeek();

/**
 * DeepSeek provider with a custom fetch that injects `reasoning_content`
 * into every assistant message in the HTTP request body. DeepSeek's reasoner
 * API requires this field on ALL assistant messages — omitting it causes a
 * 400 "Missing reasoning_content field" error.
 *
 * This operates at the HTTP level so it's immune to SDK middleware plumbing
 * issues between providerMetadata and the message conversion layer.
 */
const deepseekReasoning = createDeepSeek({
  fetch: async (url, options) => {
    let fetchInit = options;
    if (fetchInit?.body && typeof fetchInit.body === "string") {
      try {
        const body = JSON.parse(fetchInit.body);
        if (Array.isArray(body.messages)) {
          body.messages = body.messages.map((msg: any) => {
            if (msg.role === "assistant" && !("reasoning_content" in msg)) {
              return { ...msg, reasoning_content: null };
            }
            return msg;
          });
          fetchInit = { ...fetchInit, body: JSON.stringify(body) };
        }
      } catch {
        // Not JSON — pass through
      }
    }
    return globalThis.fetch(url, fetchInit);
  },
});

function getBaseModel() {
  if (provider === "mistral") {
    return mistral("mistral-large-latest");
  }
  return deepseek("deepseek-chat");
}

function getReasoningModel() {
  if (provider === "mistral") {
    return mistral("mistral-large-latest");
  }
  return deepseekReasoning("deepseek-reasoner");
}

function getSmallModel() {
  if (provider === "mistral") {
    return mistral("mistral-small-latest");
  }
  return deepseek("deepseek-chat");
}

const baseModel = getBaseModel();
const reasoningModel = getReasoningModel();
const smallModel = getSmallModel();

// Wrap the reasoning model with the reasoning extraction middleware.
function wrappedReasoningModel() {
  return wrapLanguageModel({
    model: reasoningModel,
    middleware: extractReasoningMiddleware({ tagName: "think" }),
  });
}

export const myProvider = customProvider({
  languageModels: {
    // General model
    "elle-general-base": baseModel,
    "elle-general-pro": wrappedReasoningModel(),

    // Healthcare
    "elle-healthcare-base": baseModel,
    "elle-healthcare-pro": wrappedReasoningModel(),

    // E-commerce
    "elle-commerce-base": baseModel,
    "elle-commerce-pro": wrappedReasoningModel(),

    // SaaS
    "elle-saas-base": baseModel,
    "elle-saas-pro": wrappedReasoningModel(),

    // EdTech
    "elle-edtech-base": baseModel,
    "elle-edtech-pro": wrappedReasoningModel(),

    // Real Estate
    "elle-real-estate-base": baseModel,
    "elle-real-estate-pro": wrappedReasoningModel(),

    // Travel & Hospitality
    "elle-travel-base": baseModel,
    "elle-travel-pro": wrappedReasoningModel(),

    // Gaming & Esports
    "elle-esports-base": baseModel,
    "elle-esports-pro": wrappedReasoningModel(),

    "title-model": smallModel,
    "artifact-model": smallModel,
  },
});
