import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { InfluencerPost } from "src/types/influencer-post";

export const getClaimExtractionPrompt = (
  posts: Array<InfluencerPost>
): ChatCompletionCreateParamsNonStreaming => ({
  messages: [
    {
      role: "developer",
      content: `You will receive an array of social network posts. For each post, you should check what health claims 
      are being made, considering that a single post may contain more than 1 health claim. You should give your response 
      as a JSON object containing an array of claims, where the 'claim' field should be a string containing the claim 
      in its most basic form (minimal necessary words to keep it meaningful), and the 'influencerId' should be a copy of 
      the respective post's 'influencerId' attribute.`,
    },
    {
      role: "user",
      content: JSON.stringify(
        posts.map((post) => ({
          text: post.content,
          influencerId: post.influencerId,
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
        required: ["claims"],
        properties: {
          claims: {
            type: "array",
            additionalProperties: false,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["influencerId", "claim"],
              properties: {
                influencerId: {
                  type: "string",
                },
                claim: {
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
