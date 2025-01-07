import { Claim } from "@influencer-checker/api/src/types/claim";
import { InfluencerProfile } from "@influencer-checker/api/src/types/influencer-profile";
import { createContext } from "react";

type ContextState = {
  influencers: Record<string, InfluencerProfile<string>>;
  claims: Record<string, Claim<string>>;
  fetching: boolean;
};

const defaultState: ContextState = {
  influencers: {},
  claims: {},
  fetching: true,
};

const AppContext = createContext(defaultState);

export default AppContext;
