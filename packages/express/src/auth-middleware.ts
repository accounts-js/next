import { get, isEmpty } from 'lodash';

export default function authMiddleware(accountsServer) {
  return async (req, res, next) => {
    const accessToken =
      get(req.headers, 'accounts-access-token', undefined) ||
      get(req.body, 'accessToken', undefined);
    if (!isEmpty(accessToken)) {
      try {
        const user = await accountsServer.resumeSession(accessToken);
        req.user = user;
        req.userId = user.id;
      } catch (err) {}
    }
    next();
  };
}
