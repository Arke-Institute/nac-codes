export interface Entity {
  label: string;
  type: string;
  properties?: Record<string, any>;
}

export interface ReviewRequest {
  entity1: Entity;
  entity2: Entity;
  similarity: number;
}

export interface ReviewResponse {
  decision: "SAME" | "DIFFERENT";
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface DeepInfraResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Env {
  DEEPINFRA_API_KEY: string;
  DEEPINFRA_MODEL?: string;
}
