import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { mistral } from "@ai-sdk/mistral";

const provider = process.env.AI_PROVIDER || "deepseek";

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
  return deepseek("deepseek-reasoner");
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

export const myProvider = customProvider({
  languageModels: {
    // General model
    "elle-general-base": baseModel,
    "elle-general-pro": wrapLanguageModel({
      model: reasoningModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Healthcare
    "elle-healthcare-base": baseModel,
    "elle-healthcare-pro": wrapLanguageModel({
      model: reasoningModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // E-commerce
    "elle-commerce-base": baseModel,
    "elle-commerce-pro": wrapLanguageModel({
      model: reasoningModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // SaaS
    "elle-saas-base": baseModel,
    "elle-saas-pro": wrapLanguageModel({
      model: reasoningModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // EdTech
    "elle-edtech-base": baseModel,
    "elle-edtech-pro": wrapLanguageModel({
      model: reasoningModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Real Estate
    "elle-real-estate-base": baseModel,
    "elle-real-estate-pro": wrapLanguageModel({
      model: reasoningModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Travel & Hospitality
    "elle-travel-base": baseModel,
    "elle-travel-pro": wrapLanguageModel({
      model: reasoningModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    // Gaming & Esports
    "elle-esports-base": baseModel,
    "elle-esports-pro": wrapLanguageModel({
      model: reasoningModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),

    "title-model": smallModel,
    "artifact-model": smallModel,
  },
});
