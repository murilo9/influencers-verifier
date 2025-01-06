import { Claim } from "@influencer-checker/api/src/types/claim";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import ClaimCard from "../components/claim-card";
import axios from "axios";
import { makeUrl } from "../http";
import { InfluencerProfile } from "@influencer-checker/api/src/types/influencer-profile";
import { PopulatedClaimSource } from "../types/populated-claim-source";

const processateSources = (
  influencers: Record<string, InfluencerProfile<string>>,
  claim: Claim<string>
): Array<PopulatedClaimSource> => {
  return Object.entries(claim.sources).map(([influencerId, source]) => {
    const influencerProfile = influencers[influencerId];
    const { originalText, postUrl } = source;
    return {
      originalText,
      postUrl,
      influencerProfile,
    };
  });
};

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Array<Claim<string>>>([]);
  const [influencers, setInfluencers] = useState<
    Record<string, InfluencerProfile<string>>
  >({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    axios
      .get<Array<Claim<string>>>(makeUrl("/claims"))
      .then((res) => {
        setClaims(res.data);
      })
      .finally(() => {
        setFetching(false);
      });
    axios
      .get<Array<InfluencerProfile<string>>>(makeUrl("/influencers"))
      .then((res) => {
        setInfluencers(
          res.data.reduce(
            (store, influencer) => ({ ...store, [influencer._id]: influencer }),
            {}
          )
        );
      });
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={500} sx={{ mb: 2 }}>
        Claims
      </Typography>
      <Typography color="#444444" sx={{ mb: 4, maxWidth: "800px" }}>
        Check out the most popular health claims and their respective
        verification status and trust score.
      </Typography>
      <TextField label="Search" fullWidth sx={{ mb: 4 }} />
      <Stack spacing={1.5}>
        {fetching ? (
          "Loading claims..."
        ) : claims.length ? (
          claims.map((claim) => (
            <ClaimCard
              key={claim._id}
              claim={claim}
              populatedSources={
                Object.values(influencers).length
                  ? processateSources(influencers, claim)
                  : []
              }
            />
          ))
        ) : (
          <Typography color="textSecondary">No claims</Typography>
        )}
      </Stack>
    </Box>
  );
}
