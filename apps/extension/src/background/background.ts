import { getAuth } from '../lib/storage';
import { refreshToken } from '../lib/api';

// Proactively refresh the token 2 minutes before it expires
async function scheduleRefresh() {
  const auth = await getAuth();
  if (!auth) return;
  const msUntilExpiry = auth.expiresAt - Date.now();
  const msUntilRefresh = msUntilExpiry - 2 * 60 * 1000;
  if (msUntilRefresh <= 0) {
    await refreshToken();
  } else {
    setTimeout(async () => {
      await refreshToken();
      await scheduleRefresh();
    }, Math.min(msUntilRefresh, 60_000)); // check at most every minute
  }
}

scheduleRefresh();
