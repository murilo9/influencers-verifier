import { Claim } from "@influencer-checker/api/src/types/claim";
import { InfluencerProfile } from "@influencer-checker/api/src/types/influencer-profile";
import { PopulatedClaimSource } from "../types/populated-claim-source";

export const processateClaimSources = (
  influencers: Record<string, InfluencerProfile<string>>,
  claim: Claim<string>
): Array<PopulatedClaimSource> => {
  return Object.entries(claim.sources)
    .map(([influencerId, source]) => {
      const influencerProfile = influencers[influencerId] as
        | InfluencerProfile<string>
        | undefined;
      const { originalText, postUrl } = source;
      return influencerProfile
        ? {
            originalText,
            postUrl,
            influencerProfile,
          }
        : undefined;
    })
    .filter((claimSource) =>
      Boolean(claimSource)
    ) as Array<PopulatedClaimSource>;
};
