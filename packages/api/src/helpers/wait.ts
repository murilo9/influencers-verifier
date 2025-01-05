export const wait = async (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));
