import { Grid2, Stack, Typography } from "@mui/material";
import { Claim } from "@influencer-checker/api/src/types/claim";
import { ArticleOutlined, TaskAlt } from "@mui/icons-material";
import { getClaimVerificationStatus } from "../helpers/get-claim-verification-status";
import {
  CLAIM_STATUS_COLOR,
  CLAIM_STATUS_DESCRIPTION,
  CLAIM_STATUS_ICON,
  CLAIM_STATUS_TITLE,
} from "../types/claim-status";

type ClaimCardProps = {
  claim: Claim<string>;
};

export default function ClaimCard({ claim }: ClaimCardProps) {
  const claimStatus = getClaimVerificationStatus(claim);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={3}
      sx={{ py: 2, px: 3, bgcolor: "#f4f4f4", borderRadius: "8px" }}
    >
      <Typography fontWeight={500} sx={{ width: "600px" }}>
        {claim.normalizedClaim.charAt(0).toUpperCase() +
          claim.normalizedClaim.slice(1)}
      </Typography>
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
              {claim.score?.toFixed(2) || "-"}
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
    </Stack>
  );
}
