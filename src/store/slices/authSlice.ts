import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { isAccessTokenValid, isRefreshTokenValid } from '../../lib/auth/token';
import { clearSession, loadSession, saveSession } from '../../services/authSession';
import { enrichAuthSession } from '../../services/enrichAuthSession';
import { signOutFromGoogle } from '../../services/googleAuth';
import type { AuthSession } from '../../types/auth';

export type AuthStatus = 'hydrating' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthSession['user'] | null;
}

const initialState: AuthState = {
  status: 'hydrating',
  accessToken: null,
  refreshToken: null,
  user: null,
};

function tokenRefresh() {
  // Lazy require breaks store → authSlice → tokenRefresh → store cycles.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../services/tokenRefresh') as typeof import('../../services/tokenRefresh');
}

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const { getValidAccessToken, scheduleProactiveTokenRefresh } = tokenRefresh();
  const session = await loadSession();
  if (!session) return null;

  // Access expired → refresh before marking authenticated.
  if (!isAccessTokenValid(session.accessToken)) {
    if (!isRefreshTokenValid(session.refreshToken)) {
      await clearSession();
      return null;
    }

    const accessToken = await getValidAccessToken(session);
    if (!accessToken) return null;

    const refreshed = await loadSession();
    if (!refreshed) return null;
    const enriched = await enrichAuthSession(refreshed);
    scheduleProactiveTokenRefresh();
    return enriched;
  }

  const enriched = await enrichAuthSession(session);
  scheduleProactiveTokenRefresh();
  return enriched;
});

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (session: AuthSession) => {
    const { scheduleProactiveTokenRefresh } = tokenRefresh();
    const enriched = await enrichAuthSession(session);
    await saveSession(enriched);
    scheduleProactiveTokenRefresh();
    return enriched;
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  const { clearRefreshTimer } = tokenRefresh();
  clearRefreshTimer();
  await signOutFromGoogle();
  await clearSession();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionRefreshed(state, action: PayloadAction<AuthSession>) {
      state.status = 'authenticated';
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
    },
    userProfileUpdated(
      state,
      action: PayloadAction<{ name?: string | null; avatar?: string | null }>,
    ) {
      if (!state.user) return;
      if (action.payload.name !== undefined) {
        state.user.name = action.payload.name;
      }
      if (action.payload.avatar !== undefined) {
        state.user.avatar = action.payload.avatar;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.status = 'authenticated';
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.user = action.payload.user;
        } else {
          state.status = 'unauthenticated';
          state.accessToken = null;
          state.refreshToken = null;
          state.user = null;
        }
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.status = 'unauthenticated';
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
      })
      .addCase(signIn.fulfilled, (state, action: PayloadAction<AuthSession>) => {
        state.status = 'authenticated';
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.status = 'unauthenticated';
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
      })
      .addCase(signOut.rejected, (state) => {
        state.status = 'unauthenticated';
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
      });
  },
});

export const { sessionRefreshed, userProfileUpdated } = authSlice.actions;
export default authSlice.reducer;
