import { Env, ReviewRequest, ReviewResponse } from "./types";
import { reviewMerge } from "./deepinfra";

/**
 * Validate request body structure
 */
function validateRequest(body: any): body is ReviewRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const { entity1, entity2, similarity } = body;

  // Check entity1
  if (
    !entity1 ||
    typeof entity1.label !== "string" ||
    typeof entity1.type !== "string"
  ) {
    return false;
  }

  // Check entity2
  if (
    !entity2 ||
    typeof entity2.label !== "string" ||
    typeof entity2.type !== "string"
  ) {
    return false;
  }

  // Check similarity
  if (typeof similarity !== "number" || isNaN(similarity)) {
    return false;
  }

  return true;
}

/**
 * Handle POST /review endpoint
 */
async function handleReview(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();

    if (!validateRequest(body)) {
      return new Response(
        JSON.stringify({
          error: "Invalid request format. Expected: { entity1: { label, type, properties? }, entity2: { label, type, properties? }, similarity: number }",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const model = env.DEEPINFRA_MODEL || "meta-llama/Llama-3.3-70B-Instruct";

    const result: ReviewResponse = await reviewMerge(
      env.DEEPINFRA_API_KEY,
      model,
      body.entity1,
      body.entity2,
      body.similarity
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing review:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Handle GET /health endpoint
 */
function handleHealth(): Response {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "ai-review-gateway",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Main worker entry point
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle OPTIONS for CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Route handling
    if (url.pathname === "/health" && request.method === "GET") {
      const response = handleHealth();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    if (url.pathname === "/review" && request.method === "POST") {
      const response = await handleReview(request, env);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({
        error: "Not found",
        availableEndpoints: [
          "GET /health - Health check",
          "POST /review - Entity resolution review",
        ],
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  },
};
