// Keeps the account password in MEMORY only (never localStorage/sessionStorage),
// so it disappears on refresh, tab close and logout. Used to lock downloaded PDFs.
let secret = "";

export const setSecret = (value) => {
  secret = value || "";
};
export const getSecret = () => secret;
export const clearSecret = () => {
  secret = "";
};