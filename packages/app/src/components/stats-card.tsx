import { Card, CardContent, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

type StatsCardProps = {
  value: string;
  label: string;
  startSlot?: ReactNode;
};

export default function StatsCard({ label, value, startSlot }: StatsCardProps) {
  return (
    <Card
      elevation={0}
      sx={{ boxShadow: "0px 2px 20px rgba(0,0,0,0.1)", borderRadius: "12px" }}
    >
      <CardContent
        sx={{
          display: "flex",
          gap: "24px",
          alignItems: "center",
          py: 2,
          pl: 4,
          pr: 5,
        }}
      >
        {startSlot}
        <Stack>
          <Typography variant="h5" fontWeight={500}>
            {value}
          </Typography>
          <Typography variant="body1">{label}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
