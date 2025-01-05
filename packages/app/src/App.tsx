import { Navigate, Route, Routes } from "react-router";
import InfluencersPage from "./pages/influencers";
import ClaimsPage from "./pages/claims";
import InfluencerProfile from "./pages/influencer-profile";

function App() {
  return (
    <Routes>
      <Route path="influencers" element={<InfluencersPage />} />
      <Route path="influencers/:influencerId" element={<InfluencerProfile />} />
      <Route path="claims" element={<ClaimsPage />} />
      <Route path="*" element={<Navigate to="/influencers" />} />
    </Routes>
  );
}

export default App;
