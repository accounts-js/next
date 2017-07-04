import * as all from '../src/index';

describe('index', () => {
  describe('AccountsServer', () => {
    it('should export AccountsServer', () => {
      expect(all.AccountsServer).toBeTruthy();
    });
  });
});
