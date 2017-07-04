import { trim, isEmpty, isFunction, isString, isPlainObject } from 'lodash';
import {
  CreateUserType,
  UserObjectType,
  HashAlgorithm,
  PasswordType,
  DBInterface,
  PasswordLoginType,
  PasswordLoginUserIdentityType,
} from '@accounts/common';
import { hashPassword, bcryptPassword, verifyPassword } from './encryption';

export const isEmail = (email?: string) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return email && re.test(email);
};

export interface AccountsPasswordOptions {
  passwordHashAlgorithm?: HashAlgorithm;
  passwordResetTokenExpirationInDays?: number;
  passwordEnrollTokenExpirationInDays?: number;
  minimumPasswordLength?: number;
  validateNewUser?: (user: CreateUserType) => Promise<boolean>;
  validateEmail?(email?: string): boolean;
  validatePassword?(email?: string): boolean;
  validateUsername?(email?: string): boolean;
}

const defaultOptions = {
  passwordResetTokenExpirationInDays: 3,
  passwordEnrollTokenExpirationInDays: 30,
  minimumPasswordLength: 7,
  validateEmail(email?: string): boolean {
    const isValid = !isEmpty(trim(email || '')) && isEmail(email);
    return Boolean(isValid);
  },
  validatePassword(password?: string): boolean {
    const isValid = !isEmpty(password);
    return isValid;
  },
  validateUsername(username?: string): boolean {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;
    const isValid =
      username && !isEmpty(trim(username)) && usernameRegex.test(username);
    return Boolean(isValid);
  },
};

export default class AccountsPassword {
  private options: AccountsPasswordOptions;
  private db: DBInterface;

  constructor(options: AccountsPasswordOptions) {
    this.options = { ...defaultOptions, ...options };
  }

  public async authenticate(
    params: PasswordLoginType
  ): Promise<UserObjectType> {
    const { user, password } = params;
    if (!user || !password) {
      throw new Error('Unrecognized options for login request');
    }
    if ((!isString(user) && !isPlainObject(user)) || !isString(password)) {
      throw new Error('Match failed');
    }

    let foundUser;
    /* if (this._options.passwordAuthenticator) {
      foundUser = await this._externalPasswordAuthenticator(
        this._options.passwordAuthenticator,
        user,
        password
      );
    } else { */
    foundUser = await this.passwordAuthenticator(user, password);

    if (!foundUser) {
      throw new Error('User not found');
    }

    return foundUser;
  }

  /**
   * @description Create a new user.
   * @param user - The user object.
   * @returns Return the id of user created.
   */
  public async createUser(user: CreateUserType): Promise<string> {
    if (
      !this.options.validateUsername(user.username) &&
      !this.options.validateEmail(user.email)
    ) {
      throw new Error('Username or Email is required');
    }

    if (user.username && (await this.db.findUserByUsername(user.username))) {
      throw new Error('Username already exists');
    }

    if (user.email && (await this.db.findUserByEmail(user.email))) {
      throw new Error('Email already exists');
    }

    let password;
    if (user.password) {
      password = await this.hashAndBcryptPassword(user.password);
    }

    const proposedUserObject = {
      username: user.username,
      email: user.email && user.email.toLowerCase(),
      password,
      profile: user.profile,
    };

    const { validateNewUser } = this.options;
    if (
      isFunction(validateNewUser) &&
      !await validateNewUser(proposedUserObject)
    ) {
      throw new Error('User invalid');
    }

    return this.db.createUser(proposedUserObject);
  }

  /**
   * @description Change a user's username.
   * Use this instead of directly updating the database.
   * @param userId - User id.
   * @param newUsername - A new email address for the user.
   */
  public setUsername(userId: string, newUsername: string): Promise<void> {
    return this.db.setUsername(userId, newUsername);
  }

  /**
   * @description Add an email address for a user.
   * Use this instead of directly updating the database.
   * @param userId - User id.
   * @param newEmail - A new email address for the user.
   * @param [verified=false] - Whether the new email address should be marked as verified.
   * Defaults to false.
   */
  public addEmail(
    userId: string,
    newEmail: string,
    verified: boolean = false
  ): Promise<void> {
    return this.db.addEmail(userId, newEmail, verified);
  }

  /**
   * @description Remove an email address for a user.
   * Use this instead of directly updating the database.
   * @param userId - User id.
   * @param email - The email address to remove.
   */
  public removeEmail(userId: string, email: string): Promise<void> {
    return this.db.removeEmail(userId, email);
  }

  private async passwordAuthenticator(
    user: string | PasswordLoginUserIdentityType,
    password: PasswordType
  ): Promise<any> {
    const { username, email, id } = isString(user)
      ? this.toUsernameAndEmail({ user })
      : this.toUsernameAndEmail({ ...user });

    let foundUser;

    if (id) {
      // this._validateLoginWithField('id', user);
      foundUser = await this.db.findUserById(id);
    } else if (username) {
      // this._validateLoginWithField('username', user);
      foundUser = await this.db.findUserByUsername(username);
    } else if (email) {
      // this._validateLoginWithField('email', user);
      foundUser = await this.db.findUserByEmail(email);
    }

    if (!foundUser) {
      throw new Error('User not found');
    }
    const hash = await this.db.findPasswordHash(foundUser.id);
    if (!hash) {
      throw new Error('User has no password set');
    }

    const hashAlgorithm = this.options.passwordHashAlgorithm;
    const pass: any = hashAlgorithm
      ? hashPassword(password, hashAlgorithm)
      : password;
    const isPasswordValid = await verifyPassword(pass, hash);

    if (!isPasswordValid) {
      throw new Error('Incorrect password');
    }

    return foundUser;
  }

  private async hashAndBcryptPassword(password: PasswordType): Promise<string> {
    const hashAlgorithm = this.options.passwordHashAlgorithm;
    const hashedPassword: any = hashAlgorithm
      ? hashPassword(password, hashAlgorithm)
      : password;
    return bcryptPassword(hashedPassword);
  }

  /**
   * Given a username, user and/or email figure out the username and/or email.
   *
   * @param user An object containing at least `username`, `user` and/or `email`.
   * @returns An object containing `id`, `username` and `email`.
   */
  private toUsernameAndEmail({ user, username, email, id }: any): any {
    if (user && !username && !email) {
      if (isEmail(user)) {
        email = user;
        username = null;
      } else {
        username = user;
        email = null;
      }
    }
    return { username, email, id };
  }
}
