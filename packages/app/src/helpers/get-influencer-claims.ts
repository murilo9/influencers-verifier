import { Claim } from "@influencer-checker/api/src/types/claim";
import { InfluencerProfile } from "@influencer-checker/api/src/types/influencer-profile";

export const getInfluencerClaims = (
  claims: Record<string, Claim<string>>,
  influencer: InfluencerProfile<string>,
  verifiedOnly = true
) =>
  Object.values(claims).filter((claim) => {
    const isVerified =
      claim.verificationStatus === "verified" && claim.score !== null;
    const isMentionedByInfluencer = Boolean(claim.sources[influencer._id]);
    return (verifiedOnly ? isVerified : true) && isMentionedByInfluencer;
  });
