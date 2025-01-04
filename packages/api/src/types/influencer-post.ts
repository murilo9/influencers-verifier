import { ObjectId } from "mongodb";

export type InfluencerPost = {
  _id: ObjectId;
  localId: string;
  socialNetwork: "instagram" | "facebook";
  url: string;
  content: string;
};
