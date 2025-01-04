import { ObjectId } from "mongodb";

export type InfluencerProfile = {
  _id: ObjectId;
  slug: string;
  name: string;
  socialProfile: {
    twitter: string | null;
    instagram: string | null;
    facebook: string | null;
    youtube: string | null;
    tiktok: string | null;
  };
};
