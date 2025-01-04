import { ObjectId } from "mongodb";

export type PostFetchRunner = {
  _id: ObjectId;
  influencerId: ObjectId;
  socialNetwork: "instagram" | "facebook";
};
