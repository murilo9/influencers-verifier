import { Navigate, Route, Routes } from "react-router";
import InfluencersPage from "./pages/influencers";
import ClaimsPage from "./pages/claims";
import { Box } from "@mui/material";
import AppContext from "./app-context";
import { useEffect, useState } from "react";
import { InfluencerProfile } from "@influencer-checker/api/src/types/influencer-profile";
import { Claim } from "@influencer-checker/api/src/types/claim";
import axios from "axios";
import { makeUrl } from "./http";
import InfluencerProfilePage from "./pages/influencer-profile";
import AdminPanelPage from "./pages/admin-panel";
import { useAuth } from "./helpers/useAuth";
import AdminPanelSignInPage from "./pages/admin-panel-signin";
import Header from "./components/header";

function App() {
  const [influencers, setInfluencers] = useState<
    Record<string, InfluencerProfile<string>>
  >({});
  const [claims, setClaims] = useState<Record<string, Claim<string>>>({});
  const [fetching, setFetching] = useState(true);
  const { accessToken } = useAuth();

  const loadInfluencers = async () => {
    const res = await axios.get<Array<InfluencerProfile<string>>>(
      makeUrl("/influencers")
    );
    setInfluencers(
      res.data.reduce(
        (store, influencer) => ({ ...store, [influencer._id]: influencer }),
        {}
      )
    );
  };

  const loadClaims = async () => {
    const res = await axios.get<Array<Claim<string>>>(makeUrl("/claims"));
    setClaims(
      res.data.reduce((store, claim) => ({ ...store, [claim._id]: claim }), {})
    );
  };

  const loadAll = async () => {
    const promises = [loadInfluencers(), loadClaims()];
    await Promise.all(promises);
    setFetching(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <>
      <Header />
      <Box sx={{ maxWidth: "1280px", width: "100%", margin: "auto" }}>
        <AppContext.Provider
          value={{ claims, influencers, fetching, loadClaims, loadInfluencers }}
        >
          <Routes>
            <Route path="influencers" element={<InfluencersPage />} />
            <Route
              path="influencers/:influencerId"
              element={<InfluencerProfilePage />}
            />
            <Route path="claims" element={<ClaimsPage />} />
            <Route
              path="admin"
              element={
                accessToken ? <AdminPanelPage /> : <AdminPanelSignInPage />
              }
            />
            <Route path="*" element={<Navigate to="/influencers" />} />
          </Routes>
        </AppContext.Provider>
      </Box>
    </>
  );
}

export default App;
