import { omit, isString } from 'lodash';
import * as jwt from 'jsonwebtoken';
import { UserObjectType, LoginReturnType, TokensType } from '@accounts/common';
import { ConnectionInformationsType, DBInterface } from './types';
import { generateAccessToken, generateRefreshToken } from './tokens';

export interface AccountsServerOptions {
  db: DBInterface;
  tokenSecret: string;
  tokenConfigs?: {
    accessToken?: {
      expiresIn?: string;
    };
    refreshToken?: {
      expiresIn?: string;
    };
  };
}

const defaultOptions = {
  tokenSecret: 'secret',
  tokenConfigs: {
    accessToken: {
      expiresIn: '90m',
    },
    refreshToken: {
      expiresIn: '7d',
    },
  },
};

export default class AccountsServer {
  private services: any;
  private db: DBInterface;
  private options: AccountsServerOptions;

  constructor(services, options: AccountsServerOptions) {
    this.services = services;
    this.options = { ...defaultOptions, ...options };
    this.db = this.options.db;
    for (const service in this.services) {
      this.services[service].db = this.db;
    }
  }

  public async loginWithService(
    serviceName: string,
    params,
    infos: ConnectionInformationsType
  ): Promise<LoginReturnType> {
    if (!this.services[serviceName]) {
      throw new Error(
        `No service with the name ${serviceName} was registered.`
      );
    }
    const user: UserObjectType = await this.services[serviceName].authenticate(
      params
    );
    if (!user) {
      throw new Error(
        `Service ${serviceName} was not able to authenticate user`
      );
    }
    return this.loginWithUser(user, infos);
  }

  /**
   * @description Server use only. This method creates a session
   * without authenticating any user identity.
   * Any authentication should happen before calling this function.
   */
  public async loginWithUser(
    user: UserObjectType,
    infos: ConnectionInformationsType
  ): Promise<LoginReturnType> {
    const { ip, userAgent } = infos;
    const sessionId = await this.db.createSession(user.id, ip, userAgent);
    const { accessToken, refreshToken } = this.createTokens(sessionId);

    const loginResult = {
      sessionId,
      user: this.sanitizeUser(user),
      tokens: {
        refreshToken,
        accessToken,
      },
    };

    return loginResult;
  }

  /**
   * @description Check if a session is valid.
   */
  public async resumeSession(
    accessToken: string
  ): Promise<UserObjectType | null> {
    try {
      const session = await this.findSessionByAccessToken(accessToken);

      if (session.valid) {
        const user = await this.db.findUserById(session.userId);

        if (!user) {
          throw new Error('User not found');
        }

        /* if (this._options.resumeSessionValidator) {
          try {
            await this._options.resumeSessionValidator(user, session);
          } catch (e) {
            throw new AccountsError(e, { id: session.userId }, 403);
          }
        }

        this.hooks.emit(ServerHooks.ResumeSessionSuccess, user, accessToken); */

        return this.sanitizeUser(user);
      }

      // this.hooks.emit(ServerHooks.ResumeSessionError, new AccountsError('Invalid Session', { id: session.userId }));

      return null;
    } catch (e) {
      // this.hooks.emit(ServerHooks.ResumeSessionError, e);

      throw e;
    }
  }

  /**
   * @description Find a session with a valid access token.
   * @param accessToken - Valid access token.
   */
  private async findSessionByAccessToken(accessToken: string): Promise<any> {
    if (!isString(accessToken)) {
      throw new Error('An accessToken is required');
    }

    let sessionId;
    try {
      const decodedAccessToken = jwt.verify(
        accessToken,
        this.options.tokenSecret
      );
      sessionId = decodedAccessToken.data.sessionId;
    } catch (err) {
      throw new Error('Tokens are not valid');
    }

    const session = await this.db.findSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  /**
   * @description Refresh a user token.
   * @param sessionId - User session id.
   * @param isImpersonated - Should be true if impersonating another user.
   * @returns Return a new accessToken and refreshToken.
   */
  private createTokens(
    sessionId: string,
    isImpersonated: boolean = false
  ): TokensType {
    const { tokenSecret, tokenConfigs } = this.options;
    const accessToken = generateAccessToken({
      data: {
        sessionId,
        isImpersonated,
      },
      secret: tokenSecret,
      config: tokenConfigs.accessToken,
    });
    const refreshToken = generateRefreshToken({
      secret: tokenSecret,
      config: tokenConfigs.refreshToken,
    });
    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: UserObjectType): UserObjectType {
    return omit(user, ['services']);
  }
}
