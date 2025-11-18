import { DeepInfraResponse, Entity, ReviewResponse } from "./types";
import { buildPrompt, SYSTEM_PROMPT } from "./prompt";
import { parseDecision } from "./parser";

const DEEPINFRA_API_URL = "https://api.deepinfra.com/v1/openai/chat/completions";
const DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct";
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;

/**
 * Sleep helper for exponential backoff
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call DeepInfra API with retry logic
 */
async function callDeepInfraWithRetry(
  apiKey: string,
  model: string,
  prompt: string,
  retries = MAX_RETRIES
): Promise<DeepInfraResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(DEEPINFRA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 10, // Decision-only mode
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepInfra API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data as DeepInfraResponse;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt
      if (attempt < retries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt) * 1000;
        await sleep(backoffMs);
      }
    }
  }

  throw lastError || new Error("Failed to call DeepInfra API after retries");
}

/**
 * Review entity merge decision using DeepInfra LLM
 */
export async function reviewMerge(
  apiKey: string,
  model: string,
  entity1: Entity,
  entity2: Entity,
  similarity: number
): Promise<ReviewResponse> {
  const prompt = buildPrompt(entity1, entity2, similarity);

  const response = await callDeepInfraWithRetry(apiKey, model, prompt);

  const decision = parseDecision(response.choices[0].message.content);

  return {
    decision,
    input_tokens: response.usage.prompt_tokens,
    output_tokens: response.usage.completion_tokens,
    total_tokens: response.usage.total_tokens,
  };
}
