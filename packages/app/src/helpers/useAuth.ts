import axios from "axios";
import { makeUrl } from "../http";

export const useAuth = () => ({
  accessToken: window.localStorage.getItem("access_token"),
  signIn(accessToken: string) {
    window.localStorage.setItem("access_token", accessToken);
  },
  signOut() {
    window.localStorage.removeItem("access_token");
  },
  async validateAuth(accessToken: string) {
    return axios.get(makeUrl("/authorization"), {
      headers: { Authorization: accessToken },
    });
  },
});
