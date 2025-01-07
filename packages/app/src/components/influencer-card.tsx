import {
  InfluencerProfile,
  InfluencerSocialProfile,
} from "@influencer-checker/api/src/types/influencer-profile";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { SOCIAL_ICONS } from "../helpers/social-icons";
import {
  InsertChartOutlined,
  PersonOutline,
  TaskAlt,
} from "@mui/icons-material";
import { useContext } from "react";
import AppContext from "../app-context";
import { getScoreStatus } from "../helpers/get-claim-verification-status";
import { Link } from "react-router";
import { getInfluencerClaims } from "../helpers/get-influencer-claims";

type InfluencerCardProps = {
  influencer: InfluencerProfile<string>;
};

export default function InfluencerCard({ influencer }: InfluencerCardProps) {
  const { claims } = useContext(AppContext);
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

  return (
    <Stack
      direction="row"
      spacing={3}
      sx={{ py: 2, px: 3, bgcolor: "#f4f4f4", borderRadius: "8px" }}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#cccccc",
        }}
      >
        <PersonOutline sx={{ fontSize: "28px", color: "#222222" }} />
      </Stack>
      <Stack alignItems="flex-start" direction="row" sx={{ flex: 1 }}>
        <Link to={`/influencers/${influencer._id}`}>
          <Typography
            variant="body1"
            fontWeight={500}
            sx={{ width: "240px", ":hover": { textDecoration: "underline" } }}
          >
            {influencer.name
              .split(" ")
              .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
              .join(" ")}
          </Typography>
        </Link>
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
              {Object.keys(influencerCategories).map((category) => (
                <Box sx={{ pb: 1 }}>
                  <Chip label={category} color="primary" variant="outlined" />
                </Box>
              ))}
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
    </Stack>
  );
}
