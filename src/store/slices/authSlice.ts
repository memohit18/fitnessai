import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { clearSession, loadSession, saveSession } from '../../services/authSession';
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

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => loadSession());

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (session: AuthSession) => {
    await saveSession(session);
    return session;
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await signOutFromGoogle();
  await clearSession();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
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
      });
  },
});

export default authSlice.reducer;
