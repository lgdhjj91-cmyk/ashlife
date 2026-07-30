export const hasAdminClaim = (tokenResult) => tokenResult?.claims?.admin === true;
