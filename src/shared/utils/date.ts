export const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
