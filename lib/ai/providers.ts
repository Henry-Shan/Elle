import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { deepseek } from "@ai-sdk/deepseek";

export const myProvider = customProvider({
  languageModels: {
    // General model
    "elle-general-base": deepseek("deepseek-chat"),
    "elle-general-pro": wrapLanguageModel({
      model: deepseek("deepseek-reasoner"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Healthcare
    "elle-healthcare-base": deepseek("deepseek-chat"),
    "elle-healthcare-pro": wrapLanguageModel({
      model: deepseek("deepseek-reasoner"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // E-commerce
    "elle-commerce-base": deepseek("deepseek-chat"),
    "elle-commerce-pro": wrapLanguageModel({
      model: deepseek("deepseek-reasoner"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // SaaS
    "elle-saas-base": deepseek("deepseek-chat"),
    "elle-saas-pro": wrapLanguageModel({
      model: deepseek("deepseek-reasoner"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // EdTech
    "elle-edtech-base": deepseek("deepseek-chat"),
    "elle-edtech-pro": wrapLanguageModel({
      model: deepseek("deepseek-reasoner"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Real Estate
    "elle-real-estate-base": deepseek("deepseek-chat"),
    "elle-real-estate-pro": wrapLanguageModel({
      model: deepseek("deepseek-reasoner"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Travel & Hospitality
    "elle-travel-base": deepseek("deepseek-chat"),
    "elle-travel-pro": wrapLanguageModel({
      model: deepseek("deepseek-reasoner"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Gaming & Esports
    "elle-esports-base": deepseek("deepseek-chat"),
    "elle-esports-pro": wrapLanguageModel({
      model: deepseek("deepseek-reasoner"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    "title-model": deepseek("deepseek-chat"),
    "artifact-model": deepseek("deepseek-chat"),
  },
});
