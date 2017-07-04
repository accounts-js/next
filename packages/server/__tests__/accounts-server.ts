import AccountsServer from '../src/accounts-server';

describe('AccountsServer', () => {
  describe('resumeSession', () => {
    const accountsServer = new AccountsServer();
    accountsServer.db = {};

    it('throws error if user is not found', async () => {
      accountsServer.db.findSessionById = () =>
        Promise.resolve({
          sessionId: '456',
          valid: true,
          userId: '123',
        });
      accountsServer.db.findUserById = () => Promise.resolve(null);
      try {
        const { accessToken } = accountsServer.createTokens('456');
        await accountsServer.resumeSession(accessToken);
        throw new Error();
      } catch (err) {
        const { message } = err;
        expect(message).toEqual('User not found');
      }
    });

    it('return false if session is not valid', async () => {
      const user = {
        userId: '123',
        username: 'username',
      };
      accountsServer.db.findSessionById = () =>
        Promise.resolve({
          sessionId: '456',
          valid: false,
          userId: '123',
        });
      accountsServer.db.findUserById = () => Promise.resolve(user);
      const { accessToken } = accountsServer.createTokens('456');
      const ret = await accountsServer.resumeSession(accessToken);
      expect(ret).not.toBeTruthy();
    });

    it('return user', async () => {
      const user = {
        userId: '123',
        username: 'username',
      };
      accountsServer.db.findSessionById = () =>
        Promise.resolve({
          sessionId: '456',
          valid: true,
          userId: '123',
        });
      accountsServer.db.findUserById = () => Promise.resolve(user);
      const { accessToken } = accountsServer.createTokens('456');
      const foundUser = await accountsServer.resumeSession(accessToken);
      expect(foundUser).toEqual(user);
    });
  });

  describe('findSessionByAccessToken', () => {
    const accountsServer = new AccountsServer();
    accountsServer.db = {};

    it('requires access token', async () => {
      try {
        await accountsServer.findSessionByAccessToken();
        throw new Error();
      } catch (err) {
        expect(err.message).toEqual('An accessToken is required');
      }
    });

    it('throws error if tokens are not valid', async () => {
      try {
        await accountsServer.findSessionByAccessToken('bad access token');
        throw new Error();
      } catch (err) {
        expect(err.message).toEqual('Tokens are not valid');
      }
    });

    it('throws error if session not found', async () => {
      accountsServer.db.findSessionById = () => Promise.resolve(null);
      try {
        const { accessToken } = accountsServer.createTokens();
        await accountsServer.findSessionByAccessToken(accessToken);
        throw new Error();
      } catch (err) {
        expect(err.message).toEqual('Session not found');
      }
    });

    it('find the session', async () => {
      const sessionReturn = { a: 'a' };
      accountsServer.db.findSessionById = () => Promise.resolve(sessionReturn);
      const { accessToken } = accountsServer.createTokens();
      const session = await accountsServer.findSessionByAccessToken(
        accessToken
      );
      expect(session).toEqual(sessionReturn);
    });
  });

  describe('createTokens', () => {
    const accountsServer = new AccountsServer();
    it('should create tokens', () => {
      const tokens = accountsServer.createTokens('a');
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });
  });

  describe('sanitizeUser', () => {
    const accountsServer = new AccountsServer();
    const userObject = { username: 'test', services: [], id: '123' };
    it('internal sanitizer should clean services field from the user object', () => {
      const modifiedUser = accountsServer.sanitizeUser(userObject);
      expect(modifiedUser.services).toBeUndefined();
    });
  });
});
