import { ObjectId } from "mongodb";

type InfluencerId = string;

export type Claim<T> = {
  _id: T;
  normalizedClaim: string;
  verificationStatus: "verified" | "unverified";
  categories: Array<string>;
  sources: Record<
    InfluencerId,
    {
      originalText: string;
      postUrl: string;
    }
  >;
  articlesFound: number;
  score: number | null; // Claim status (supported, debunked, questionable) will be deducted from score (unsupported if score is null)
};
