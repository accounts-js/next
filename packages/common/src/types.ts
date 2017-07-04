export interface UserObjectType {
  username?: string;
  email?: string;
  emails?: object[];
  id: string;
  profile?: object;
  services?: object;
}

export interface TokensType {
  accessToken?: string;
  refreshToken?: string;
}

export interface LoginReturnType {
  sessionId: string;
  user: UserObjectType;
  tokens: TokensType;
}

export interface SessionType {
  sessionId: string;
  userId: string;
  valid: boolean;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export type HashAlgorithm =
  | 'sha'
  | 'sha1'
  | 'sha224'
  | 'sha256'
  | 'sha384'
  | 'sha512'
  | 'md5'
  | 'ripemd160';

export type PasswordType =
  | string
  | {
      digest: string;
      algorithm: HashAlgorithm;
    };

export interface CreateUserType {
  username?: string;
  email?: string;
  password?: PasswordType;
  profile?: object;
}

export interface LoginUserIdentityType {
  id?: string;
  username?: string;
  email?: string;
}

export interface PasswordLoginType {
  user: string | LoginUserIdentityType;
  password: PasswordType;
}

export const EMAIL_ONLY = 'EMAIL_ONLY';
export const USERNAME_AND_EMAIL = 'USERNAME_AND_EMAIL';
export const USERNAME_AND_OPTIONAL_EMAIL = 'USERNAME_AND_OPTIONAL_EMAIL';
export const USERNAME_ONLY = 'USERNAME_ONLY';

export enum PasswordSignupFields {
  EMAIL_ONLY = 'EMAIL_ONLY',
  USERNAME_AND_EMAIL = 'USERNAME_AND_EMAIL',
  USERNAME_AND_OPTIONAL_EMAIL = 'USERNAME_AND_OPTIONAL_EMAIL',
  USERNAME_ONLY = 'USERNAME_ONLY',
}
