import { Box, Grid2, Link, Stack, Typography } from "@mui/material";
import { PopulatedClaimSource } from "../types/populated-claim-source";

type ClaimSourceEntryProps = {
  source: PopulatedClaimSource;
};

export default function ClaimSourceEntry({ source }: ClaimSourceEntryProps) {
  return (
    <Box sx={{ py: 2, borderTop: "1px solid #cccccc" }}>
      <Grid2 container>
        <Grid2 size={3}>
          <Stack spacing={1}>
            <Typography>{source.influencerProfile.name}</Typography>
            <Link href={source.postUrl} underline="hover">
              <Typography>Original post</Typography>
            </Link>
          </Stack>
        </Grid2>
        <Grid2 size={9}>
          <Typography variant="body2">{source.originalText}</Typography>
        </Grid2>
      </Grid2>
    </Box>
  );
}
