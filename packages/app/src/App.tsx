import { Navigate, Route, Routes } from "react-router";
import InfluencersPage from "./pages/influencers";
import ClaimsPage from "./pages/claims";
import InfluencerProfile from "./pages/influencer-profile";
import { Box } from "@mui/material";

function App() {
  return (
    <Box sx={{ maxWidth: "1280px", width: "100%", margin: "auto" }}>
      <Routes>
        <Route path="influencers" element={<InfluencersPage />} />
        <Route
          path="influencers/:influencerId"
          element={<InfluencerProfile />}
        />
        <Route path="claims" element={<ClaimsPage />} />
        <Route path="*" element={<Navigate to="/influencers" />} />
      </Routes>
    </Box>
  );
}

export default App;
