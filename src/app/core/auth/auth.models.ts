export interface AuthUser {
  id: number;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
