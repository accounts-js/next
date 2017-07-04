import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export const generateRandomToken = (length: number = 43) =>
  crypto.randomBytes(length).toString('hex');

export const generateAccessToken = ({
  secret,
  data,
  config,
}: {
  secret: string;
  data?: any;
  config: object;
}) =>
  jwt.sign(
    {
      data,
    },
    secret,
    config
  );

export const generateRefreshToken = ({
  secret,
  data,
  config,
}: {
  secret: string;
  data?: any;
  config: object;
}) =>
  jwt.sign(
    {
      data,
    },
    secret,
    config
  );
