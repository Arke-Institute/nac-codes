/**
 * Parse LLM response to extract decision
 *
 * CRITICAL: Uses the fixed parser from AI_REVIEWER_FINAL_REPORT.md:388-415
 * to avoid false positives when both "SAME" and "DIFFERENT" appear in response.
 *
 * Strategy:
 * 1. First, look for decision at the start of lines (primary method)
 * 2. Fallback: check which word appears first in first 100 chars
 * 3. Conservative default: "DIFFERENT" if uncertain
 */
export function parseDecision(response: string): "SAME" | "DIFFERENT" {
  const lines = response.trim().split("\n");
  let decision: "SAME" | "DIFFERENT" | null = null;

  // First, try to find explicit answer line
  for (const line of lines) {
    const lineStripped = line.trim();
    if (lineStripped.toUpperCase().startsWith("SAME")) {
      decision = "SAME";
      break;
    } else if (lineStripped.toUpperCase().startsWith("DIFFERENT")) {
      decision = "DIFFERENT";
      break;
    }
  }

  // If no explicit line, check which word appears first in first 100 chars
  if (!decision) {
    const firstWords = response.slice(0, 100).toUpperCase();
    const samePos = firstWords.indexOf("SAME");
    const diffPos = firstWords.indexOf("DIFFERENT");

    if (samePos >= 0 && (diffPos < 0 || samePos < diffPos)) {
      decision = "SAME";
    } else if (diffPos >= 0) {
      decision = "DIFFERENT";
    } else {
      // Conservative fallback: don't merge if uncertain
      decision = "DIFFERENT";
    }
  }

  return decision;
}
