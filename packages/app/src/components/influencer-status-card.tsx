import {
  InfluencerProfile,
  InfluencerRegistrationStatus,
} from "@influencer-checker/api/src/types/influencer-profile";
import { Box, Grid2, Typography, capitalize, Button } from "@mui/material";

const registrationStatus: Record<InfluencerRegistrationStatus, string> = {
  done: "Done",
  verifying_claims: "Verifying Claims",
  extracting_claims: "Extracting claims",
  fetching_posts: "Fetching posts",
  error: "Error",
};

const isTimeouted = (influencer: InfluencerProfile<string>) =>
  influencer.registration.status !== "done" &&
  new Date().getTime() - influencer.registration.lastUpdate > 1000 * 60 * 5;

const getRegistrationStatus = (influencer: InfluencerProfile<string>) => {
  const isTimeout = isTimeouted(influencer);
  return isTimeout
    ? "Timeout error"
    : registrationStatus[influencer.registration.status];
};

type InfluencerStatusCardProps = {
  influencer: InfluencerProfile<string>;
  setInfluencerToRemove: (influencer: InfluencerProfile<string>) => void;
};

export default function InfluencerStatusCard({
  influencer,
  setInfluencerToRemove,
}: InfluencerStatusCardProps) {
  return (
    <Box sx={{ background: "#dddddd", borderRadius: "8px", p: 2 }}>
      <Grid2 container>
        <Grid2 size={3}>
          <Typography>{capitalize(influencer.name)}</Typography>
        </Grid2>
        <Grid2 size={3}>
          <Typography>{getRegistrationStatus(influencer)}</Typography>
        </Grid2>
        <Grid2 size={3}>
          <Typography>
            {influencer.registration.errors.length
              ? influencer.registration.errors[0].message
              : "-"}
          </Typography>
        </Grid2>
        <Grid2 size={3}>
          {influencer.registration.status === "error" ||
          influencer.registration.status === "done" ||
          isTimeouted(influencer) ? (
            <Button
              color="error"
              onClick={() => setInfluencerToRemove(influencer)}
            >
              Delete
            </Button>
          ) : (
            <Typography>-</Typography>
          )}
        </Grid2>
      </Grid2>
    </Box>
  );
}
