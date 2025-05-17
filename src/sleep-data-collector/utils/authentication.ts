export const isTokenExpired = (tokenExpirationDate: any) => {
  if (!tokenExpirationDate) {
    return true;
  }

  const now = new Date();
  return tokenExpirationDate < now;
};
