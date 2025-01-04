import { ObjectId } from "mongodb";

export type InfluencerPost = {
  _id: ObjectId;
  influencerId: ObjectId;
  localId: string;
  socialNetwork: "instagram" | "facebook";
  url: string;
  content: string;
};
