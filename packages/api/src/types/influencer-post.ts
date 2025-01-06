import { ObjectId } from "mongodb";

export type InfluencerPost<T> = {
  _id: T;
  influencerId: T;
  localId: string;
  socialNetwork: "instagram" | "facebook";
  url: string;
  content: string;
};
