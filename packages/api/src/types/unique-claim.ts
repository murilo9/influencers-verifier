import { ObjectId } from "mongodb";

export type UniqueClaim = {
  _id: ObjectId;
  hash: string;
  verificationStatus: "verified" | "questionable" | "debunked" | "unverified";
};
