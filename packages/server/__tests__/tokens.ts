import {
  generateAccessToken,
  generateRefreshToken,
  generateRandomToken,
} from '../src/tokens';

describe('tokens', () => {
  const config = {
    config: {},
    data: {},
    secret: 'secret',
  };

  describe('generateRandomToken', () => {
    it('should generate an random token', () => {
      const randomToken = generateRandomToken();
      expect(randomToken).toBeTruthy();
      expect(randomToken.length).toBe(86);
    });

    it('should generate an random token with length', () => {
      const randomToken = generateRandomToken(60);
      expect(randomToken).toBeTruthy();
      expect(randomToken.length).toBe(120);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate an accessToken', () => {
      const accessToken = generateAccessToken(config);
      expect(accessToken).toBeTruthy();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate an refreshToken', () => {
      const refreshToken = generateRefreshToken(config);
      expect(refreshToken).toBeTruthy();
    });
  });
});
