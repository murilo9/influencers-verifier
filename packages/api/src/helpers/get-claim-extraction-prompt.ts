import { ObjectId } from "mongodb";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { InfluencerPost } from "src/types/influencer-post";

export const getClaimExtractionPrompt = (
  posts: Array<InfluencerPost<ObjectId>>
): ChatCompletionCreateParamsNonStreaming => ({
  messages: [
    {
      role: "developer",
      content: `You will receive an array of social network posts. For each post, you should check what health claims 
      are being made (if any), as statements. A health claim refers to any explicit or implicit statement suggesting that a 
      product, service, idea, or action has an effect on physical or mental health, whether positive or negative. You should 
      give your response as a JSON object containing an array of claims, where: the 'claim' field should be a string 
      containing the claim in its most basic form (minimal necessary words to keep its full meaning as an affirmmative or 
      negative statement), the 'categories' field should be an array of claim categories ('nutrition', 'fitness', 'reproduction', 
      'sickness treatment', 'beauty', 'health conditions', 'preventive', 'sleep and recovery', 'child health', 'gender and sexuality', 
      'immunity and infection', 'genetics' or 'mental health') the 'influencerId' should be a copy of the respective 
      post's 'influencerId' attribute, the 'originalText' field should be a copy of the original post text, and 
      the 'postUrl' attribute should be a copy of the post url.`,
    },
    {
      role: "user",
      content: JSON.stringify(
        posts.map((post) => ({
          text: post.content,
          influencerId: post.influencerId,
          postUrl: post.url,
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
              required: [
                "influencerId",
                "claim",
                "originalText",
                "postUrl",
                "categories",
              ],
              properties: {
                influencerId: {
                  type: "string",
                },
                claim: {
                  type: "string",
                },
                originalText: {
                  type: "string",
                },
                postUrl: {
                  type: "string",
                },
                categories: {
                  type: "array",
                  aditionalProperties: false,
                  items: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});
