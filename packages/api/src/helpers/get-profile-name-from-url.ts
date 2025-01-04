export const getProfileNameFromSocialUrl = (url: string) => {
  const params = url.split("/");
  return params[params.length - 1].replace("@", "");
};
