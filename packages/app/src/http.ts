const BASE_URL = import.meta.env.PROD
  ? "https://influencer-checker-api.sitehenger.com"
  : "http://localhost:3000";

export const makeUrl = (route: string) => BASE_URL + route;
