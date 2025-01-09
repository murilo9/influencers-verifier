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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { makeUrl } from "../http";
import {
  InfluencerProfile,
  InfluencerRegistrationStatus,
} from "@influencer-checker/api/src/types/influencer-profile";
import AppContext from "../app-context";

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

export default function AdminPanelPage() {
  const { accessToken, validateAuth, signOut } = useAuth();
  const [influencerName, setInfluencerName] = useState("");
  const { loadInfluencers, influencers } = useContext(AppContext);
  const [registeringInfluencer, setRegisteringInfluencer] = useState(false);
  const [influencerToRemove, setInfluencerToRemove] =
    useState<InfluencerProfile<string> | null>(null);

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

  const onInit = async () => {
    if (accessToken) {
      try {
        await validateAuth(accessToken);
      } catch (error) {
        console.log(error);
        signOut();
      }
    }
  };

  const onInterval = async () => {
    console.log("onInterval");
    await validateAuth(accessToken || "");
    await loadInfluencers();
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">Admin Panel</Typography>
      <Typography>
        Here you can register new influencers and check the registration status
        (posts finding, claims extraction, claims verification, etc).
      </Typography>
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
      <Typography variant="h6" sx={{ mt: 4 }}>
        Influencers' Status
      </Typography>
      <Typography>
        You can keep track of all influencers' registration status here. If
        there is an error, you can delete the influencer and try to register it
        again.
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
        ))}
      </Stack>
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
    </Box>
  );
}
