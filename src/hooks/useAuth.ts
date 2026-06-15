import { useCallback } from 'react';

import { signIn as signInAction, signOut as signOutAction } from '../store/slices/authSlice';
import type { AuthSession } from '../types/auth';
import { useAppDispatch, useAppSelector } from './store';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { status, accessToken, refreshToken, user } = useAppSelector((state) => state.auth);

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
