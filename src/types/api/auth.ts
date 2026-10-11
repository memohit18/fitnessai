export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceType: 'mobile';
  deviceName: string;
}

export interface ApiAuthUser {
  id?: string;
  _id?: string;
  email: string;
  name?: string | null;
}

export interface AuthTokenPayload {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  /** Desktop/auth-service refresh shape */
  access?: string;
  refresh?: string;
  token?: string;
  user?: ApiAuthUser;
  data?: AuthTokenPayload & {
    user?: ApiAuthUser;
  };
}

export type SignupResponse = AuthTokenPayload & {
  message?: string;
};

export type LoginResponse = AuthTokenPayload & {
  message?: string;
};

export type RefreshResponse = AuthTokenPayload & {
  message?: string;
};

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar?: string | null;
  isEmailVerified?: boolean;
}
