import { ObjectId } from "mongodb";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { Claim } from "src/types/claim";

export const getArticleSearchQueryPrompt = (
  claims: Array<Claim<ObjectId>>
): ChatCompletionCreateParamsNonStreaming => ({
  messages: [
    {
      role: "developer",
      content: `You will receive an array of health claims. For each claim, you should retrieve its semantic 
      elements (subject, action and target). Give your response as a JSON object containing an array of claims' semantic elements, 
      where: the 'subject' field should be an array of strings containing a claim's subject and its synonyms, the 'action' 
      field should be a string containging the claim's action, the 'target' field should be an array of strings containing 
      the claim's target(s) and its/their synonyms, and the 'claimId' should be a copy of the claim id attribute.`,
    },
    {
      role: "user",
      content: JSON.stringify(
        claims.map((claim) => ({
          id: claim._id.toString(),
          claim: claim.normalizedClaim,
        }))
      ),
    },
  ],
  model: "gpt-4o-mini",
  response_format: {
    type: "json_schema",
    json_schema: {
      strict: true,
      name: "claim_schema",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["elements"],
        properties: {
          elements: {
            type: "array",
            additionalProperties: false,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["subject", "action", "target", "claimId"],
              properties: {
                subject: {
                  type: "array",
                  aditionalProperties: false,
                  items: {
                    type: "string",
                  },
                },
                action: {
                  type: "string",
                },
                target: {
                  type: "array",
                  aditionalProperties: false,
                  items: {
                    type: "string",
                  },
                },
                claimId: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },
});
