import { ObjectId } from "mongodb";

type InfluencerId = string;

export type Claim = {
  _id: ObjectId;
  normalizedClaim: string;
  verificationStatus: "verified" | "questionable" | "debunked" | "unverified";
  sources: Record<
    InfluencerId,
    {
      originalText: string;
      postUrl: string;
    }
  >;
};
