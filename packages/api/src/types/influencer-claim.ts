import { ObjectId } from "mongodb";

export type InfluencerClaim = {
  _id: ObjectId;
  influencerId: ObjectId;
  originalText: string;
  uniqueClaimId: ObjectId;
};
