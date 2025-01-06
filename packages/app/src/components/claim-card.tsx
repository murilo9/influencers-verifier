import { Stack, Typography } from "@mui/material";
import { Claim } from "@influencer-checker/api/src/types/claim";
import { TaskAlt } from "@mui/icons-material";

type ClaimCardProps = {
  claim: Claim<string>;
};

export default function ClaimCard({ claim }: ClaimCardProps) {
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
      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={5}
        sx={{ flex: 1 }}
      >
        {claim.score !== null ? (
          <Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TaskAlt sx={{ fontSize: "20px" }} />
              <Typography variant="h6">{claim.score.toFixed(2)}</Typography>
            </Stack>
            <Typography fontSize="14px">Trust Score</Typography>
          </Stack>
        ) : null}
        <Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TaskAlt sx={{ fontSize: "20px" }} />
            <Typography variant="h6">Supported</Typography>
          </Stack>
          <Typography fontSize="14px">Verified Claims</Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
