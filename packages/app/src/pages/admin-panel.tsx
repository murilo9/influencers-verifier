import { useAuth } from "../helpers/useAuth";
import {
  Box,
  Button,
  capitalize,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { makeUrl } from "../http";
import { InfluencerProfile } from "@influencer-checker/api/src/types/influencer-profile";
import AppContext from "../app-context";
import InfluencerStatusCard from "../components/influencer-status-card";
import ClaimCard from "../components/claim-card";
import { processateClaimSources } from "../helpers/processate-claim-sorces";
import { Claim } from "@influencer-checker/api/src/types/claim";

export default function AdminPanelPage() {
  const { accessToken, validateAuth, signOut } = useAuth();
  const [influencerName, setInfluencerName] = useState("");
  const [claimText, setClaimText] = useState("");
  const { loadInfluencers, loadClaims, influencers, claims } =
    useContext(AppContext);
  const [registeringInfluencer, setRegisteringInfluencer] = useState(false);
  const [addingClaim, setAddingClaim] = useState(false);
  const [showClaimAddSuccessToast, setShowClaimAddSuccessToast] =
    useState(false);
  const [influencerToRemove, setInfluencerToRemove] =
    useState<InfluencerProfile<string> | null>(null);
  const [claimToDelete, setClaimToDelete] = useState<Claim<string> | null>(
    null
  );
  const [selectedView, setSelectedView] = useState<"influencers" | "claims">(
    "influencers"
  );
  const claimsList = Object.values(claims);

  const onRegisterInfluencerClick = async () => {
    if (!accessToken) {
      signOut();
    }
    try {
      await axios.post<InfluencerProfile<string>>(
        makeUrl("/influencers"),
        {
          name: influencerName,
        },
        {
          headers: {
            authorization: accessToken,
          },
        }
      );
      setInfluencerName("");
      await loadInfluencers();
    } catch (error) {
      console.log(error);
    } finally {
      setRegisteringInfluencer(false);
    }
  };

  const onAddClaimClick = async () => {
    setAddingClaim(true);
    try {
      await axios.post(
        makeUrl("/custom-claims"),
        { text: claimText },
        {
          headers: {
            Authorization: accessToken,
          },
        }
      );
      setShowClaimAddSuccessToast(true);
      setClaimText("");
    } catch (error) {
      console.log(error);
    } finally {
      setAddingClaim(false);
    }
  };

  const onDeleteClaim = async () => {
    setClaimToDelete(null);
    try {
      await axios.delete(makeUrl(`/claims/${claimToDelete?._id}`), {
        headers: { Authorization: accessToken },
      });
      await loadClaims();
    } catch (error) {
      console.log(error);
    }
  };

  const onInit = async () => {
    if (accessToken) {
      try {
        await validateAuth(accessToken);
      } catch (error) {
        console.log(error);
        signOut();
        window.location.reload();
      }
    }
  };

  const onInterval = async () => {
    console.log("onInterval");
    await validateAuth(accessToken || "");
    await loadInfluencers();
    await loadClaims();
  };

  const onRemoveInfluencer = async () => {
    if (influencerToRemove) {
      try {
        await axios.delete(makeUrl(`/influencers/${influencerToRemove._id}`), {
          headers: {
            authorization: accessToken,
          },
        });
        await loadInfluencers();
      } catch (error) {
        console.log(error);
      } finally {
        setInfluencerToRemove(null);
      }
    }
  };

  useEffect(() => {
    onInit();
    const interval = setInterval(() => onInterval(), 4000);
    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (selectedView) {
      case "influencers":
        return (
          <>
            <Typography variant="h6" sx={{ mt: 4 }}>
              Register Influencer
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Influencer Name"
                size="small"
                value={influencerName}
                onChange={({ target: { value } }) => setInfluencerName(value)}
                sx={{ width: "600px" }}
              />
              <Button
                variant="contained"
                disabled={registeringInfluencer}
                onClick={onRegisterInfluencerClick}
              >
                Register
              </Button>
            </Stack>
            <Typography sx={{ color: "#444444", mt: 0.5 }}>
              Note: an influencer's registration takes 2 minutes in the average
              to be completed. Avoid registering a new influencer while another
              registration process is still ongoing.
            </Typography>
            <Typography variant="h6" sx={{ mt: 4 }}>
              Influencers' Status
            </Typography>
            <Typography>
              You can keep track of all influencers' registration status here.
              If there is an error, you can delete the influencer and try to
              register it again.
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <Box sx={{ px: 2, py: 1 }}>
                <Grid2 container>
                  <Grid2 size={3}>
                    <Typography>Influencer</Typography>
                  </Grid2>
                  <Grid2 size={3}>
                    <Typography>Registration Status</Typography>
                  </Grid2>
                  <Grid2 size={3}>
                    <Typography>Last Error</Typography>
                  </Grid2>
                  <Grid2 size={3}>
                    <Typography>Actions</Typography>
                  </Grid2>
                </Grid2>
              </Box>
              {Object.values(influencers).map((influencer) => (
                <InfluencerStatusCard
                  influencer={influencer}
                  setInfluencerToRemove={setInfluencerToRemove}
                />
              ))}
            </Stack>
          </>
        );
      case "claims":
        return (
          <>
            <Typography variant="h6" sx={{ mt: 4 }}>
              Add Claim
            </Typography>
            <Typography sx={{ mb: 1 }}>
              Add a custom claim to be verified.
            </Typography>
            <TextField
              label='Write a health claim here (e.g. "Eating pineapple reduces depression...")'
              size="small"
              multiline
              minRows={3}
              value={claimText}
              onChange={({ target: { value } }) => setClaimText(value)}
              sx={{ width: "600px" }}
            />
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                disabled={!claimText.trim() || addingClaim}
                onClick={onAddClaimClick}
              >
                Add
              </Button>
            </Stack>
            <Typography variant="h6" sx={{ mt: 4 }}>
              Claims List
            </Typography>
            <Typography variant="body2" sx={{ color: "#444444" }}>
              Disclose: AI's claim extractiion is not 100% perfect, and some
              non-helath-related claims can still be generated, and can be
              manually deleted.
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 5 }}>
              {claimsList.length ? (
                claimsList.map((claim) => (
                  <ClaimCard
                    key={claim._id}
                    claim={claim}
                    showDeleteButton
                    onDeleteClick={() => setClaimToDelete(claim)}
                    populatedSources={
                      Object.values(influencers).length
                        ? processateClaimSources(influencers, claim)
                        : []
                    }
                  />
                ))
              ) : (
                <Typography color="textSecondary">No claims</Typography>
              )}
            </Stack>
          </>
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">Admin Panel</Typography>
      <Typography>
        Here you can manage influencers and claims. You should see updates in
        real time but if that doesn't happen, try refreshing the page.
      </Typography>
      <Tabs
        value={selectedView}
        onChange={(_, value) => setSelectedView(value)}
        sx={{ mt: 3, borderBottom: "1px solid #dddddd" }}
      >
        <Tab label="Influencers" value="influencers" />
        <Tab label="Claims" value="claims" />
      </Tabs>
      {renderView()}
      <Dialog open={Boolean(influencerToRemove)}>
        <DialogTitle>Remove Influencer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this influencer?
          </Typography>
          <Typography fontWeight={500} sx={{ mt: 1 }}>
            {capitalize(influencerToRemove?.name || "")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setInfluencerToRemove(null)}>
            Cancel
          </Button>
          <Button color="error" onClick={onRemoveInfluencer}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(claimToDelete)}>
        <DialogTitle>Remove Claim</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this claim?</Typography>
          <Typography fontWeight={500} sx={{ mt: 1 }}>
            {claimToDelete?.normalizedClaim}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setClaimToDelete(null)}>
            Cancel
          </Button>
          <Button color="error" onClick={onDeleteClaim}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={showClaimAddSuccessToast}
        autoHideDuration={4000}
        onClose={() => setShowClaimAddSuccessToast(false)}
        message="A custom claim was successfully added and will be listed soon."
      />
    </Box>
  );
}
