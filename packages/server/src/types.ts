import { SessionType, CreateUserType, UserObjectType } from '@accounts/common';

export interface ConnectionInformationsType {
  ip?: string;
  userAgent?: string;
}

export interface DBInterface {
  // Find user by identity fields
  findUserByEmail(email: string): Promise<UserObjectType | null>;
  findUserByUsername(username: string): Promise<UserObjectType | null>;
  findUserById(userId: string): Promise<UserObjectType | null>;
  findUserByOAuthId(
    service: string,
    id: string
  ): Promise<UserObjectType | null>;

  // Create and update users
  createUser(user: CreateUserType): Promise<string>;
  setUsername(userId: string, newUsername: string): Promise<void>;
  setProfile(userId: string, profile: object): Promise<object>;

  // Password related operation
  findPasswordHash(userId: string): Promise<string | null>;
  findUserByResetPasswordToken(token: string): Promise<UserObjectType | null>;
  setPasssword(userId: string, newPassword: string): Promise<void>;
  addResetPasswordToken(
    userId: string,
    email: string,
    token: string,
    reason?: string
  ): Promise<void>;
  setResetPasssword(
    userId: string,
    email: string,
    newPassword: string,
    token: string
  ): Promise<void>;

  // Email related operations
  findUserByEmailVerificationToken(
    token: string
  ): Promise<UserObjectType | null>;
  addEmail(userId: string, newEmail: string, verified: boolean): Promise<void>;
  removeEmail(userId: string, email: string): Promise<void>;
  verifyEmail(userId: string, email: string): Promise<void>;
  addEmailVerificationToken(
    userId: string,
    email: string,
    token: string
  ): Promise<void>;

  // Session related operations
  findSessionById(sessionId: string): Promise<SessionType | null>;
  createSession(
    userId: string,
    ip?: string,
    userAgent?: string
  ): Promise<string>;
  updateSession(
    sessionId: string,
    ip: string,
    userAgent: string
  ): Promise<void>;
  invalidateSession(sessionId: string): Promise<void>;
  invalidateAllSessions(userId: string): Promise<void>;
}
