import { useCallback } from 'react';

import { signIn as signInAction, signOut as signOutAction } from '../store/slices/authSlice';
import type { AuthSession } from '../types/auth';
import { useAppDispatch, useAppSelector } from './store';

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const status = auth?.status ?? 'hydrating';
  const accessToken = auth?.accessToken ?? null;
  const refreshToken = auth?.refreshToken ?? null;
  const user = auth?.user ?? null;

  const signIn = useCallback(
    (session: AuthSession) => dispatch(signInAction(session)),
    [dispatch],
  );

  const signOut = useCallback(() => dispatch(signOutAction()), [dispatch]);

  return {
    status,
    accessToken,
    refreshToken,
    user,
    isHydrating: status === 'hydrating',
    isAuthenticated: status === 'authenticated',
    signIn,
    signOut,
  };
}
