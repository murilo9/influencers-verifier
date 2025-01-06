import { ObjectId } from "mongodb";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { Article } from "src/types/article";
import { Claim } from "src/types/claim";

export const getClaimVerificationPrompt = (
  claim: Claim<ObjectId>,
  articles: Array<Article>
): ChatCompletionCreateParamsNonStreaming => ({
  messages: [
    {
      role: "developer",
      content: `You will receive a health claim and a list of articles (with 'title', 'abstract' and 'articleId' attributes). 
      For each article, you have to check if it is 
      related to the claim's subject and, if so, you have to check if the article either supports the claim, contradicts 
      the claim or is inconclusive. For articles that support or contradict the claim, you also have to tell how 
      strongly it does so. You should give your answer as a JSON object containing a list of results (article analysis), where on 
      each result: the 'direction' field should be a string stating how the article relates with the claim 
      ('support', 'contradict', 'inconclusive' or 'unrelated'); the 'strength' field should be a string stating the 
      support/contradiction strenght ('mild' or 'strong') or 'n/a' if the article is inconclusive or unrelated to the 
      claim; the 'articleId' field should be a string with a copy of the article's 'id' field; the 'articleTitle' field 
      should be a copy of the article's 'title' field; and the 'articleUrl' should be a copy of the article's 'url' field.`,
    },
    {
      role: "user",
      content: JSON.stringify({
        claim,
        articles: articles.map((article) => ({
          articleId: article.id,
          title: article.title,
          abstract: article.abstract,
          url: article.url,
        })),
      }),
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
        required: ["results"],
        properties: {
          results: {
            type: "array",
            additionalProperties: false,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "direction",
                "strength",
                "articleId",
                "articleUrl",
                "articleTitle",
              ],
              properties: {
                direction: {
                  type: "string",
                },
                strength: {
                  type: "string",
                },
                articleId: {
                  type: "string",
                },
                articleTitle: {
                  type: "string",
                },
                articleUrl: {
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
