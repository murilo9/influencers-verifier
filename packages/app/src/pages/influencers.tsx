import { Box, Stack, TextField, Typography } from "@mui/material";
import { InsertChartOutlined, People, TaskAlt } from "@mui/icons-material";
import { useContext } from "react";
import StatsCard from "../components/stats-card";
import InfluencerCard from "../components/influencer-card";
import AppContext from "../app-context";

export default function InfluencersPage() {
  const { influencers, claims } = useContext(AppContext);
  const influencersList = Object.values(influencers);
  const verifiedClaims = Object.values(claims).filter(
    (claim) => claim.verificationStatus === "verified"
  );
  const claimsWithScore = verifiedClaims.filter(
    (claim) => claim.score !== null
  );
  const averageTrustScore = claimsWithScore.length
    ? claimsWithScore.reduce(
        (scoreSubTotal, claim) => scoreSubTotal + (claim.score || 0),
        0
      ) / claimsWithScore.length
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={500} sx={{ mb: 2 }}>
        Influencers List
      </Typography>
      <Typography color="#444444" sx={{ mb: 4, maxWidth: "800px" }}>
        Real-time rankings of health influencers based on scientific accurracy,
        credibility, and transparency. Updated daily using AI-powered analysis.
      </Typography>
      <Stack
        direction="row"
        justifyContent="flex-start"
        spacing={2.5}
        sx={{ mb: 5 }}
      >
        <StatsCard
          label="Active Influencers"
          value={String(influencersList.length)}
          startSlot={<People sx={{ fontSize: "48px" }} />}
        />
        <StatsCard
          label="Claims Verified"
          value={String(verifiedClaims.length)}
          startSlot={<TaskAlt sx={{ fontSize: "48px" }} />}
        />
        <StatsCard
          value={(averageTrustScore * 10).toFixed(1)}
          label="Average Trust Score"
          startSlot={<InsertChartOutlined sx={{ fontSize: "48px" }} />}
        />
      </Stack>
      <Stack sx={{ mb: 5 }}>
        <TextField label="Search" />
      </Stack>
      <Stack spacing={1.5}>
        {influencersList.length ? (
          influencersList.map((influencer) => (
            <InfluencerCard influencer={influencer} />
          ))
        ) : (
          <Typography color="textSecondary">No influencers</Typography>
        )}
      </Stack>
    </Box>
  );
}
