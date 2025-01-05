import { ObjectId } from "mongodb";

type InfluencerId = string;

export type Claim = {
  _id: ObjectId;
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
  score: number | null; // Claim status (supported, debunked, questionable) will be deducted from score (unsupported if score is null)
};
