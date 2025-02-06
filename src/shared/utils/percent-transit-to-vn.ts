export const percentTransitToVN = (inTransitVNAt: string) => {
  const diffTime = new Date().getTime() - new Date(inTransitVNAt).getTime();
  const percent = Math.floor(diffTime / ((1000 * 60 * 60) / 1.5));
  const value = percent < 0 ? 0 : percent > 99 ? 99 : percent;

  return value;
};
