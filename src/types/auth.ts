export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
