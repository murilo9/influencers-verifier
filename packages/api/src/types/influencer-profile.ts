import { ObjectId } from "mongodb";

export type InfluencerSocialProfile = {
  twitter: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  tiktok: string | null;
};

export type InfluencerProfile = {
  _id: ObjectId;
  slug: string;
  name: string;
  socialProfile: InfluencerSocialProfile;
};
