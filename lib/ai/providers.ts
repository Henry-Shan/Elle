import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { openai } from "@ai-sdk/openai";

export const myProvider = customProvider({
  languageModels: {
    // General model
    "elle-general-base": openai("gpt-4o"),
    "elle-general-pro": wrapLanguageModel({
      model: openai("gpt-4o"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Healthcare
    "elle-healthcare-base": openai("gpt-4o"),
    "elle-healthcare-pro": wrapLanguageModel({
      model: openai("gpt-4o"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // E-commerce
    "elle-commerce-base": openai("gpt-4o"),
    "elle-commerce-pro": wrapLanguageModel({
      model: openai("gpt-4o"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // SaaS
    "elle-saas-base": openai("gpt-4o"),
    "elle-saas-pro": wrapLanguageModel({
      model: openai("gpt-4o"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // EdTech
    "elle-edtech-base": openai("gpt-4o"),
    "elle-edtech-pro": wrapLanguageModel({
      model: openai("gpt-4o"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Real Estate
    "elle-real-estate-base": openai("gpt-4o"),
    "elle-real-estate-pro": wrapLanguageModel({
      model: openai("gpt-4o"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Travel & Hospitality
    "elle-travel-base": openai("gpt-4o"),
    "elle-travel-pro": wrapLanguageModel({
      model: openai("gpt-4o"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Gaming & Esports
    "elle-esports-base": openai("gpt-4o"),
    "elle-esports-pro": wrapLanguageModel({
      model: openai("gpt-4o"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    "title-model": openai("o3-mini"),
    "artifact-model": openai("o3-mini"),
  },
});
