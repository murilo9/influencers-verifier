import { Box, Stack, TextField, Typography } from "@mui/material";
import { InsertChartOutlined, People, TaskAlt } from "@mui/icons-material";
import { useEffect, useState } from "react";
import StatsCard from "../components/stats-card";
import axios from "axios";
import { makeUrl } from "../http";
import { InfluencerProfile } from "@influencer-checker/api/src/types/influencer-profile";
import InfluencerCard from "../components/influencer-card";

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<
    Array<InfluencerProfile<string>>
  >([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    axios
      .get<Array<InfluencerProfile<string>>>(makeUrl("/influencers"))
      .then((res) => {
        const { data } = res;
        setInfluencers(data);
      })
      .catch(console.log)
      .finally(() => {
        setFetching(false);
      });
  }, []);

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
          value="1,234"
          startSlot={<People sx={{ fontSize: "48px" }} />}
        />
        <StatsCard
          label="Claims Verified"
          value="25,431"
          startSlot={<TaskAlt sx={{ fontSize: "48px" }} />}
        />
        <StatsCard
          value="8.57"
          label="Average trust score"
          startSlot={<InsertChartOutlined sx={{ fontSize: "48px" }} />}
        />
      </Stack>
      <Stack sx={{ mb: 5 }}>
        <TextField label="Search" />
      </Stack>
      <Stack spacing={1.5}>
        {fetching ? (
          "Loading influencers..."
        ) : influencers.length ? (
          influencers.map((influencer) => (
            <InfluencerCard influencer={influencer} />
          ))
        ) : (
          <Typography color="textSecondary">No influencers</Typography>
        )}
      </Stack>
    </Box>
  );
}
