import { ObjectId } from "mongodb";

export type InfluencerSocialProfile = {
  twitter: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  tiktok: string | null;
};

export type InfluencerRegistrationStatus =
  | "fetching_posts"
  | "extracting_claims"
  | "verifying_claims"
  | "done"
  | "error";

export type InfluencerProfile<T> = {
  _id: T;
  slug: string;
  name: string;
  socialProfile: InfluencerSocialProfile;
  registration: {
    status: InfluencerRegistrationStatus;
    lastUpdate: number;
    errors: Array<{ timestamp: number; message: string }>;
  };
};
