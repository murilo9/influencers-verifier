export type ArticleVerificationResult = {
  articleId: string;
  direction: "support" | "contradict" | "inconclusive" | "unrelated";
  strength: "mild" | "strong";
};

export type ClaimVerificationByArticlesPayload = {
  results: Array<ArticleVerificationResult>;
};
