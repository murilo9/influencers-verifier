export const getSlug = (name: string) =>
  name.trim().toLowerCase().split(" ").join("-");
