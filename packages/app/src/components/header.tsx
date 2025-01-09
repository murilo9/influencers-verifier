import { Box, Stack, Typography } from "@mui/material";
import { Link } from "react-router";

const LINKS = [
  { label: "Influencers", href: "/influencers" },
  { label: "Claims", href: "/claims" },
  { label: "Admin Panel", href: "/admin" },
];

export default function Header() {
  return (
    <Box sx={{ borderBottom: "1px solid #dddddd" }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ width: "100%", maxWidth: "1280px", margin: "auto" }}
      >
        {LINKS.map((link) => (
          <Link to={link.href}>
            <Typography
              color="primary"
              sx={{ p: 2, ":hover": { background: "#eeeeee" } }}
            >
              {link.label}
            </Typography>
          </Link>
        ))}
      </Stack>
    </Box>
  );
}
