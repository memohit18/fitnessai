const LOG_PREFIX = '[Auth]';

function log(message: string, details?: Record<string, unknown>): void {
  if (!__DEV__) {
    return;
  }

  if (details) {
    console.log(LOG_PREFIX, message, details);
    return;
  }

  console.log(LOG_PREFIX, message);
}

export function logAuthSignIn(email: string, hasAccessToken: boolean, hasRefreshToken: boolean): void {
  log('Signed in', { email, hasAccessToken, hasRefreshToken });
}

export function logAuthHydrate(restored: boolean, email?: string): void {
  log(restored ? 'Session restored' : 'No saved session', restored ? { email } : undefined);
}

export function logAuthSignOut(): void {
  log('Signed out — tokens cleared');
}

export function logAuthState(
  isAuthenticated: boolean,
  email?: string | null,
  hasAccessToken?: boolean,
): void {
  log(isAuthenticated ? 'Authenticated' : 'Not authenticated', {
    email: email ?? null,
    hasAccessToken: Boolean(hasAccessToken),
  });
}
