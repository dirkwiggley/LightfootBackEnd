export interface UserInterface {
  id?: number;
  login: string;
  password: string;
  nickname: string;
  email: string;
  roles: string[];
  locale: string;
  active: number;
  reset_password: number;
  refreshtoken?: string;
}

export const objectIsUserInterface = (obj: unknown): obj is UserInterface => {
  const test: any = obj
  if (test.login === null || test.login === undefined) return false
  if (test.active === null || test.active === undefined) return false
  return true
}

export interface TokenInterface {
  exp: number;
  iat: number;
  isAdmin: boolean;
  login: string;
  timestamp: number;
  user_id: number;
}

// TODO: flesh this out
export const objectIsDecodedToken = (obj: unknown): obj is TokenInterface => {
  const test: any = obj;
  return test.timestamp !== null && test.timestamp !== undefined;
};
