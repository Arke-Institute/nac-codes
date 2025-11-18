# AI Review Gateway Worker

Deployed at https://ai-reconciliation.arke.institute
Worker name: ai-reconciliation

## Purpose
Cloudflare Worker gateway to DeepInfra LLM for entity resolution decisions.

## Responsibilities
- Send entity pairs to `meta-llama/Llama-3.3-70B-Instruct` for comparison
- Decision-only mode (max 10 tokens output for cost efficiency)
- Return SAME or DIFFERENT decision with confidence score
- Track token usage for cost monitoring
- Handle API rate limiting and errors

## Architecture Flow
```
Orchestrator
     ↓
[AI Review Gateway]
     ↓
DeepInfra API (Llama-3.3-70B)
```

## When Used
Only invoked when semantic similarity score is in the **uncertain range**:
- Similarity ≥ 0.9: Auto-merge (no AI review)
- **0.75 ≤ Similarity < 0.9**: AI review (this gateway)
- Similarity < 0.75: Auto-reject (no AI review)

## API Endpoint

### POST /review
Request entity resolution decision from AI.

**Request**:
```json
{
  "entity1": {
    "label": "Dr Gillingham",
    "type": "person",
    "properties": {
      "full_name": "Dr. Gillingham, M.D.",
      "role": "Faculty member"
    }
  },
  "entity2": {
    "label": "Dr Gillingham",
    "type": "person",
    "properties": {
      "title": "Doctor",
      "affiliation": "Medical College"
    }
  },
  "similarity": 0.87
}
```

**Response**:
```json
{
  "decision": "SAME",
  "confidence": 0.9,
  "input_tokens": 342,
  "output_tokens": 3,
  "total_tokens": 345
}
```

## Prompt Template
```
TASK: Determine if these two entity records refer to the SAME real-world entity or DIFFERENT entities.

ENTITY 1:
Label: "Dr Gillingham"
Type: person
Properties: {full_name: "Dr. Gillingham, M.D.", role: "Faculty member"}

ENTITY 2:
Label: "Dr Gillingham"
Type: person
Properties: {title: "Doctor", affiliation: "Medical College"}

Semantic Similarity Score: 0.870

Vote SAME if:
- Labels are identical or clear variations
- Properties consistently describe the same entity

Vote DIFFERENT if:
- Labels refer to distinct entities
- Properties describe conflicting attributes
- Temporal information shows non-overlapping existence

Your answer (one word only):
SAME or DIFFERENT
```

## Model Configuration
- **Model**: `meta-llama/Llama-3.3-70B-Instruct`
- **Temperature**: 0.1 (deterministic)
- **Max Tokens**: 10 (decision-only mode)
- **System Prompt**: "You are an expert entity resolution system. Answer with only SAME or DIFFERENT."

## Cost Optimization
- Decision-only mode: ~25% cheaper than full reasoning
- Testing showed 100% accuracy without reasoning output
- Average tokens per request: ~350 total (340 input + 3 output)

## Configuration
- **Memory**: 128 MB
- **Timeout**: 30 seconds

## Environment Variables
- `DEEPINFRA_API_KEY`: DeepInfra API key
- `DEEPINFRA_MODEL`: Model name (default: meta-llama/Llama-3.3-70B-Instruct)

## Development
```bash
npm install
npm run dev        # Local development
npm run deploy     # Deploy to Cloudflare
```
