import { ObjectId } from "mongodb";

type InfluencerId = string;

export type Claim = {
  _id: ObjectId;
  normalizedClaim: string;
  verificationStatus: "verified" | "questionable" | "debunked" | "unverified";
  categories: Array<string>;
  sources: Record<
    InfluencerId,
    {
      originalText: string;
      postUrl: string;
    }
  >;
};
