import * as express from 'express';
import { Router } from 'express';
import * as requestIp from 'request-ip';

const getUserAgent = req => {
  let userAgent = req.headers['user-agent'] || '';
  if (req.headers['x-ucbrowser-ua']) {
    // special case of UC Browser
    userAgent = req.headers['x-ucbrowser-ua'];
  }
  return userAgent;
};

export interface AccountsExpressOptions {
  path: string;
}

const defaultOptions = {
  path: '/accounts',
};

export default function accountsExpress(
  accountsServer,
  options: AccountsExpressOptions
): Router {
  options = { ...defaultOptions, ...options };
  const { path } = options;
  const router = express.Router();

  const sendError = (res, err) =>
    res.status(400).json({
      message: err.message,
      loginInfo: err.loginInfo,
      errorCode: err.errorCode,
    });

  router.post(`${path}/authenticate/:service`, async (req, res) => {
    try {
      const serviceName = req.params.service;
      const userAgent = getUserAgent(req);
      const ip = requestIp.getClientIp(req);
      const loggedInUser = await accountsServer.loginWithService(
        serviceName,
        req.body,
        { ip, userAgent }
      );
      res.json(loggedInUser);
    } catch (err) {
      sendError(res, err);
    }
  });

  // Routes for password
  if (accountsServer.services.password) {
    router.post(`${path}/register/password`, async (req, res) => {
      try {
        const loggedInUser = await accountsServer.services.password.createUser(
          req.body
        );
        res.json(loggedInUser);
      } catch (err) {
        sendError(res, err);
      }
    });

    // TODO all other routes
  }

  if (accountsServer.services.oauth) {
    router.get(`${path}/oauth/:provider/callback`, async (req, res) => {
      try {
        const userAgent = getUserAgent(req);
        const ip = requestIp.getClientIp(req);
        const loggedInUser = await accountsServer.loginWithService(
          'oauth',
          {
            ...req.params,
            ...req.query,
          },
          { ip, userAgent }
        );
        res.json(loggedInUser);
      } catch (err) {
        sendError(res, err);
      }
    });
  }

  return router;
}
