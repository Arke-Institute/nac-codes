import { Entity } from "./types";

/**
 * Format entity properties for the prompt
 * Handles entity references, lists, and regular values
 */
function formatProperties(properties: Record<string, any> | undefined): string {
  if (!properties || Object.keys(properties).length === 0) {
    return "Properties:\n  (none)";
  }

  const lines: string[] = ["Properties:"];
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "object" && value !== null && value.type === "entity_ref") {
      lines.push(`  ${key}: @${value.code}`);
    } else if (Array.isArray(value)) {
      lines.push(`  ${key}: ${value.join(", ")}`);
    } else {
      lines.push(`  ${key}: ${value}`);
    }
  }

  return lines.join("\n");
}

/**
 * Build the complete prompt for entity resolution
 * Based on AI_REVIEWER_FINAL_REPORT.md (decision-only mode)
 */
export function buildPrompt(entity1: Entity, entity2: Entity, similarity: number): string {
  return `TASK: Determine if these two entity records refer to the SAME real-world entity or DIFFERENT entities.

ENTITY 1:
Label: "${entity1.label}"
Type: ${entity1.type}
${formatProperties(entity1.properties)}

ENTITY 2:
Label: "${entity2.label}"
Type: ${entity2.type}
${formatProperties(entity2.properties)}

Semantic Similarity Score: ${similarity.toFixed(3)}

DECISION GUIDELINES:

Vote SAME if:
- Labels are identical or clear variations (abbreviations, spelling variants, translations)
- Properties consistently describe the same entity with matching key attributes
- Any differences are due to perspective, date of record, or level of detail

Vote DIFFERENT if:
- Labels refer to distinct entities (different people, places, organizations, or concepts)
- Properties describe conflicting attributes that cannot belong to the same entity
- Temporal information shows non-overlapping existence (e.g., one ended before other began)
- Contextual clues indicate relationship between entities rather than identity (related but not same)

Consider:
- Type must match for entities to be the same
- More detailed properties override less detailed ones
- Relationships mentioned in properties may indicate distinct entities
- Geographic, temporal, and contextual consistency

Your answer (one word only):
SAME or DIFFERENT`;
}

export const SYSTEM_PROMPT = "You are an expert entity resolution system. Your job is to determine if two entity records refer to the same real-world entity. Answer with only SAME or DIFFERENT.";
