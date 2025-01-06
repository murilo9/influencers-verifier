import { InfluencerProfile } from "@influencer-checker/api/src/types/influencer-profile";

// A claim's source with populated influencer profile
export type PopulatedClaimSource = {
  originalText: string;
  postUrl: string;
  influencerProfile: InfluencerProfile<string>;
};
