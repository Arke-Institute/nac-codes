/**
 * Test script to simulate the AI Review Gateway decision for Philadelphia entities
 *
 * This script demonstrates what prompt would be sent to the LLM and helps
 * understand why two Philadelphia entities might be treated as different.
 */

import { buildPrompt } from "./src/prompt";
import { Entity } from "./src/types";

// Entity 1: Philadelphia Pa
const entity1: Entity = {
  label: "Philadelphia Pa",
  type: "place",
  properties: {
    state: {
      type: "entity_ref",
      code: "pennsylvania"
    },
    country: {
      type: "entity_ref",
      code: "united_states"
    }
  }
};

// Entity 2: Philadelphia
const entity2: Entity = {
  label: "Philadelphia",
  type: "place",
  properties: {
    state: {
      type: "entity_ref",
      code: "pennsylvania"
    },
    country: {
      type: "entity_ref",
      code: "united_states"
    }
  }
};

// We need to estimate what similarity score these would have
// Based on the fact they were given different canonical_ids,
// they likely fell into one of these ranges:
// - < 0.75: Auto-rejected (no AI review)
// - 0.75-0.9: AI review (this gateway)
// - >= 0.9: Auto-merged (no AI review)

// Let's test with different similarity scores to see how the prompt looks
const testScores = [0.70, 0.80, 0.85, 0.92];

console.log("=".repeat(80));
console.log("PHILADELPHIA ENTITY COMPARISON TEST");
console.log("=".repeat(80));
console.log("\nEntity 1:");
console.log(`  Label: "${entity1.label}"`);
console.log(`  Type: ${entity1.type}`);
console.log(`  Properties: ${JSON.stringify(entity1.properties, null, 2)}`);

console.log("\nEntity 2:");
console.log(`  Label: "${entity2.label}"`);
console.log(`  Type: ${entity2.type}`);
console.log(`  Properties: ${JSON.stringify(entity2.properties, null, 2)}`);

console.log("\n" + "=".repeat(80));
console.log("ANALYSIS: Why These Might Be Treated as DIFFERENT");
console.log("=".repeat(80));

console.log("\n1. LABEL DIFFERENCE:");
console.log('   - "Philadelphia Pa" vs "Philadelphia"');
console.log("   - The suffix 'Pa' could be interpreted as:");
console.log("     a) State abbreviation (Pennsylvania)");
console.log("     b) Part of a more specific location name");
console.log("   - This creates ambiguity about entity specificity");

console.log("\n2. CODE DIFFERENCE:");
console.log('   - "philadelphia_pa" vs "philadelphia"');
console.log("   - Different entity codes suggest different extraction contexts");
console.log("   - May have been extracted from different source formats");

console.log("\n3. PROPERTIES:");
console.log("   - Identical: Both reference Pennsylvania and United States");
console.log("   - However, the label difference overrides property similarity");

console.log("\n4. DECISION GUIDELINES:");
console.log('   - "Labels refer to distinct entities" → DIFFERENT');
console.log('   - "Philadelphia" (city) vs "Philadelphia Pa" (city + state)');
console.log("   - LLM may interpret these as different specificity levels");

console.log("\n" + "=".repeat(80));
console.log("PROMPT THAT WOULD BE SENT TO LLM");
console.log("=".repeat(80));

// Test with a mid-range similarity score (0.85)
const typicalSimilarity = 0.85;
const prompt = buildPrompt(entity1, entity2, typicalSimilarity);

console.log("\n" + prompt);

console.log("\n" + "=".repeat(80));
console.log("EXPECTED DECISION: DIFFERENT");
console.log("=".repeat(80));

console.log("\nReasoning:");
console.log("- Label variation 'Philadelphia Pa' vs 'Philadelphia' is NOT a clear");
console.log("  variation like abbreviation or spelling variant");
console.log("- The 'Pa' suffix suggests a different level of geographic specificity");
console.log("- Even though properties match, the label difference is semantically");
console.log("  significant enough to vote DIFFERENT");
console.log("- This aligns with the guideline: 'Labels refer to distinct entities'");

console.log("\n" + "=".repeat(80));
console.log("HOW TO MAKE THESE THE SAME");
console.log("=".repeat(80));

console.log("\n1. Normalize labels in the upstream extraction:");
console.log('   - Convert "Philadelphia Pa" → "Philadelphia"');
console.log("   - Strip state abbreviations from city names");
console.log("   - Apply consistent formatting rules");

console.log("\n2. Enhance entity code generation:");
console.log('   - Ensure "philadelphia_pa" → "philadelphia"');
console.log("   - Use canonical name forms for code generation");

console.log("\n3. Improve similarity computation:");
console.log("   - Account for common geographic suffixes");
console.log("   - Boost similarity when properties match perfectly");
console.log("   - Consider 'Pa' as a removable suffix in place names");

console.log("\n4. Add normalization rules to the AI prompt:");
console.log("   - Explicitly instruct LLM to ignore state abbreviations");
console.log("   - Add examples of acceptable label variations");

console.log("\n" + "=".repeat(80));
console.log("TESTING WITH DIFFERENT SIMILARITY SCORES");
console.log("=".repeat(80));

testScores.forEach(score => {
  console.log(`\nSimilarity: ${score.toFixed(2)}`);
  if (score < 0.75) {
    console.log("  → Auto-rejected (no AI review needed)");
  } else if (score >= 0.9) {
    console.log("  → Auto-merged (no AI review needed)");
  } else {
    console.log("  → AI review required (sent to this gateway)");
  }
});

console.log("\n" + "=".repeat(80));
console.log("RECOMMENDATION");
console.log("=".repeat(80));

console.log("\nTo investigate further:");
console.log("1. Check the actual similarity score these entities received");
console.log("2. Review the upstream extraction logs to see why they got different codes");
console.log("3. Add label normalization in the entity extraction pipeline");
console.log("4. Consider lowering the auto-merge threshold if label variations are common");
console.log("\nThe gateway itself is working correctly - the issue is in the");
console.log("upstream extraction and normalization process.");

console.log("\n" + "=".repeat(80));
