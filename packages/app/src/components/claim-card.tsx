import { Box, Chip, Grid2, IconButton, Stack, Typography } from "@mui/material";
import { Claim } from "@influencer-checker/api/src/types/claim";
import {
  ArticleOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  TaskAlt,
} from "@mui/icons-material";
import { getClaimVerificationStatus } from "../helpers/get-claim-verification-status";
import {
  CLAIM_STATUS_COLOR,
  CLAIM_STATUS_DESCRIPTION,
  CLAIM_STATUS_ICON,
  CLAIM_STATUS_TITLE,
} from "../types/claim-status";
import { PopulatedClaimSource } from "../types/populated-claim-source";
import { Link } from "react-router";
import { useState } from "react";
import ClaimSourceEntry from "./claim-source-entry";

type ClaimCardProps = {
  claim: Claim<string>;
  populatedSources: Array<PopulatedClaimSource>;
};

export default function ClaimCard({ claim, populatedSources }: ClaimCardProps) {
  const claimStatus = getClaimVerificationStatus(claim);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Box sx={{ py: 2, px: 3, bgcolor: "#f4f4f4", borderRadius: "8px" }}>
      <Stack direction="row" alignItems="center" spacing={3}>
        <Stack>
          <Typography fontWeight={500} sx={{ width: "600px" }}>
            {claim.normalizedClaim.charAt(0).toUpperCase() +
              claim.normalizedClaim.slice(1)}
          </Typography>
          <Typography color="textSecondary" fontSize="14px">
            Mentioned by{" "}
            {populatedSources.map((source, index) => (
              <>
                {index ? ", " : ""}
                <Link to={`/influencers/${source.influencerProfile._id}`}>
                  <Typography
                    component="span"
                    color="secondary"
                    fontSize="14px"
                    sx={{ ":hover": { textDecoration: "underline" } }}
                  >
                    {source.influencerProfile.name}
                  </Typography>
                </Link>
              </>
            ))}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
            {claim.categories.map((category) => (
              <Chip
                label={category}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Stack>
        </Stack>
        <Grid2 container sx={{ flex: 1, color: "#333333" }}>
          <Grid2
            size={3}
            sx={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <ArticleOutlined
                sx={{
                  fontSize: "20px",
                  color: claim.articlesFound ? "inherit" : "#aaaaaa",
                }}
              />
              <Typography
                variant="h6"
                sx={{ height: "24px", lineHeight: "24px" }}
                color={claim.articlesFound ? "inherit" : "textDisabled"}
              >
                {claim.articlesFound}
              </Typography>
            </Stack>
            <Typography fontSize="14px">Articles Found</Typography>
          </Grid2>
          <Grid2 size={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {claim.score === null ? null : (
                <TaskAlt sx={{ fontSize: "20px" }} color={claimStatus.color} />
              )}
              <Typography
                variant="h6"
                color={claim.score === null ? "inherit" : claimStatus.color}
                sx={{ height: "24px", lineHeight: "24px" }}
              >
                {claim.score !== null
                  ? `${(claim.score * 10).toFixed(1)}/10`
                  : "-"}
              </Typography>
            </Stack>
            <Typography fontSize="14px">Trust Score</Typography>
          </Grid2>
          <Grid2 size={6} sx={{ color: "#444444" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {CLAIM_STATUS_ICON[claimStatus.label]}
              <Typography
                variant="body1"
                color={CLAIM_STATUS_COLOR[claimStatus.label]}
              >
                {CLAIM_STATUS_TITLE[claimStatus.label]}
              </Typography>
            </Stack>
            <Typography variant="body2">
              {CLAIM_STATUS_DESCRIPTION[claimStatus.label]}
            </Typography>
          </Grid2>
        </Grid2>
        <Stack>
          <IconButton onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Stack>
      </Stack>
      {isExpanded ? (
        <Stack sx={{ mt: 3 }}>
          {populatedSources.map((populatedSource) => (
            <ClaimSourceEntry source={populatedSource} />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
