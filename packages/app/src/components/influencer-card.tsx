import {
  InfluencerProfile,
  InfluencerSocialProfile,
} from "@influencer-checker/api/src/types/influencer-profile";
import { Chip, Stack, Typography } from "@mui/material";
import { SOCIAL_ICONS } from "../helpers/social-icons";
import { InsertChartOutlined, TaskAlt } from "@mui/icons-material";

type InfluencerCardProps = {
  influencer: InfluencerProfile<string>;
};

export default function InfluencerCard({ influencer }: InfluencerCardProps) {
  return (
    <Stack
      direction="row"
      spacing={3}
      sx={{ py: 2, px: 3, bgcolor: "#f4f4f4", borderRadius: "8px" }}
    >
      <img
        src="https://i1.rgstatic.net/ii/profile.image/11431281203328955-1699289675071_Q512/Jordan-Peterson-9.jpg"
        alt={influencer.name}
        style={{
          width: "56px",
          height: "56px",
          objectFit: "cover",
          borderRadius: "50%",
        }}
      />
      <Stack alignItems="center" direction="row" sx={{ flex: 1 }}>
        <Typography variant="body1" fontWeight={500} sx={{ width: "240px" }}>
          {influencer.name
            .split(" ")
            .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
            .join(" ")}
        </Typography>
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={5}
          sx={{ flex: 1, pr: 4 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            flexWrap="wrap"
          >
            <Chip
              label="Health Conditions"
              color="primary"
              variant="outlined"
            />
            <Chip label="Nutrition" color="primary" variant="outlined" />
          </Stack>
          <Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <InsertChartOutlined sx={{ fontSize: "20px" }} />
              <Typography variant="h6">8.85</Typography>
            </Stack>
            <Typography fontSize="14px">Trust Score</Typography>
          </Stack>
          <Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TaskAlt sx={{ fontSize: "20px" }} />
              <Typography variant="h6">156/163</Typography>
            </Stack>
            <Typography fontSize="14px">Verified Claims</Typography>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={1.5}
          sx={{ width: "200px" }}
        >
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
  );
}
