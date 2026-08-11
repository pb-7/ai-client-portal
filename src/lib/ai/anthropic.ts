import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";

import {
  ANTHROPIC_NARRATIVE_MODEL,
  NARRATIVE_PROMPT_VERSION,
} from "@/constants/narrative";
import { buildNarrativePrompt } from "@/lib/ai/narrative-prompt";
import {
  NARRATIVE_OUTPUT_SCHEMA,
  validateGeneratedNarrative,
} from "@/lib/validation/narrative";
import type { ClientFinancialInputs } from "@/types/client-inputs";

export type GeneratedNarrative = {
  content: NonNullable<ReturnType<typeof validateGeneratedNarrative>>;
  modelName: string;
  modelProvider: "anthropic";
  promptVersion: string;
};

export async function generateNarrativeWithClaude(
  inputs: ClientFinancialInputs,
): Promise<GeneratedNarrative> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Anthropic is not configured.");
  }

  const anthropic = new Anthropic({
    apiKey,
    maxRetries: 1,
    timeout: 45_000,
  });
  const prompt = buildNarrativePrompt(inputs);
  const response = await anthropic.messages.parse({
    model: ANTHROPIC_NARRATIVE_MODEL,
    max_tokens: 1_800,
    system: prompt.system,
    messages: [{ role: "user", content: prompt.user }],
    output_config: {
      format: jsonSchemaOutputFormat(NARRATIVE_OUTPUT_SCHEMA),
    },
  });

  if (response.stop_reason !== "end_turn" || !response.parsed_output) {
    throw new Error("Claude did not return a complete narrative.");
  }

  const content = validateGeneratedNarrative(response.parsed_output);
  if (!content) {
    throw new Error("Claude returned an invalid narrative.");
  }

  return {
    content,
    modelName: response.model,
    modelProvider: "anthropic",
    promptVersion: NARRATIVE_PROMPT_VERSION,
  };
}
