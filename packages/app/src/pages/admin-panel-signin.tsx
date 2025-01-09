import { Button, Stack, TextField, Typography } from "@mui/material";
import axios, { AxiosError } from "axios";
import { KeyboardEvent, useState } from "react";
import { makeUrl } from "../http";
import { useAuth } from "../helpers/useAuth";

export default function AdminPanelSignInPage() {
  const [password, setPassword] = useState("");
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const onSignClick = async () => {
    setFetching(true);
    setError("");
    try {
      const res = await axios.post<{ accessToken: string }>(
        makeUrl("/signin"),
        { password }
      );
      const { accessToken } = res.data;
      signIn(accessToken);
      window.location.reload();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || "Unkown error");
    } finally {
      setFetching(false);
    }
  };

  const onKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSignClick();
    }
  };

  return (
    <Stack justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
      <Stack
        spacing={3}
        textAlign="center"
        sx={{ width: "100%", maxWidth: "400px" }}
      >
        <Typography variant="h6">Admin Panel</Typography>
        {error ? (
          <Typography color="error" textAlign="left">
            {error}
          </Typography>
        ) : null}
        <TextField
          label="Password"
          type="password"
          autoFocus
          value={password}
          onChange={({ target: { value } }) => setPassword(value)}
          onKeyUp={onKeyUp}
        />
        <Stack justifyContent="flex-end" flexDirection="row">
          <Button variant="contained" disabled={fetching} onClick={onSignClick}>
            Login
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
