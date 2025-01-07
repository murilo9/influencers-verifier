import { Box, Chip, Stack, Typography } from "@mui/material";
import { useContext } from "react";
import AppContext from "../app-context";
import { useParams } from "react-router";
import {
  InfluencerProfile,
  InfluencerSocialProfile,
} from "@influencer-checker/api/src/types/influencer-profile";
import { getInfluencerClaims } from "../helpers/get-influencer-claims";
import { capitalize } from "../helpers/capitalize";
import { InsertChartOutlined, TaskAlt } from "@mui/icons-material";
import { getScoreStatus } from "../helpers/get-claim-verification-status";
import { SOCIAL_ICONS } from "../helpers/social-icons";
import ClaimCard from "../components/claim-card";
import { processateClaimSources } from "../helpers/processate-claim-sorces";

export default function InfluencerProfilePage() {
  const { claims, influencers, fetching } = useContext(AppContext);
  const { influencerId } = useParams();
  const influencer = influencers[influencerId as string] as
    | InfluencerProfile<string>
    | undefined;
  if (!influencer) {
    return fetching ? (
      <Typography variant="h6">Loading profile...</Typography>
    ) : (
      <Typography variant="h5">404 - Influencer not found</Typography>
    );
  }
  const influencerClaims = getInfluencerClaims(claims, influencer, false);
  const verifiedInfluencerClaims = getInfluencerClaims(claims, influencer);
  const trustScoreAverage = verifiedInfluencerClaims.length
    ? verifiedInfluencerClaims.reduce(
        (subTotal, claim) => subTotal + (claim.score as number),
        0
      ) / verifiedInfluencerClaims.length
    : null;
  const formattedTrustScoreAverage =
    trustScoreAverage === null ? "-" : (trustScoreAverage * 10).toFixed(1);
  const influencerCategories = influencerClaims.reduce((acc, claim) => {
    claim.categories.forEach((category) => (acc[category] = true));
    return acc;
  }, {} as Record<string, boolean>);
  const influencerCategoriesList = Object.keys(influencerCategories);

  return (
    <>
      <Typography variant="h5" sx={{ my: 3 }}>
        {capitalize(influencer.name)}
      </Typography>
      <Stack
        direction="row"
        sx={{
          p: 2,
          borderTop: "1px solid #dddddd",
          borderBottom: "1px solid #dddddd",
          mb: 2,
        }}
      >
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={5}
          sx={{ flex: 1, pr: 4 }}
        >
          <Stack spacing={1} sx={{ flex: 1 }}>
            <Typography fontSize="14px">Talks About</Typography>
            <Stack
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              spacing={1}
              flexWrap="wrap"
            >
              {influencerCategoriesList.length ? (
                influencerCategoriesList.map((category) => (
                  <Box sx={{ pb: 1 }}>
                    <Chip label={category} color="primary" variant="outlined" />
                  </Box>
                ))
              ) : (
                <Typography fontSize="20px">-</Typography>
              )}
            </Stack>
          </Stack>
          <Stack>
            <Typography fontSize="14px">Trust Score</Typography>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ color: "#333333" }}
            >
              <InsertChartOutlined
                sx={{ fontSize: "20px" }}
                color={getScoreStatus(trustScoreAverage)}
              />
              <Typography
                variant="h6"
                color={getScoreStatus(trustScoreAverage)}
              >
                {formattedTrustScoreAverage}
              </Typography>
            </Stack>
          </Stack>
          <Stack>
            <Typography fontSize="14px">Verified Claims</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TaskAlt sx={{ fontSize: "20px" }} />
              <Typography variant="h6">
                {verifiedInfluencerClaims.length}/{influencerClaims.length}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
        <Stack spacing={1} sx={{ width: "200px" }}>
          <Typography fontSize="14px" textAlign="right">
            Social Links
          </Typography>
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            {Object.entries(influencer.socialProfile).map(([social, url]) =>
              url !== null && social !== "tiktok" ? (
                <a href={url} target="_blank" style={{ color: "#333333" }}>
                  {SOCIAL_ICONS[social as keyof InfluencerSocialProfile]}
                </a>
              ) : null
            )}
          </Stack>
        </Stack>
      </Stack>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Claims
      </Typography>
      <Stack spacing={1.5}>
        {influencerClaims.length ? (
          influencerClaims.map((claim) => (
            <ClaimCard
              claim={claim}
              populatedSources={processateClaimSources(influencers, claim)}
            />
          ))
        ) : (
          <Typography variant="body2">No claims</Typography>
        )}
      </Stack>
    </>
  );
}
