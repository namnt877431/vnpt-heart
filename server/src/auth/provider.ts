import type { Config } from '../config';
import type { Db } from '../db/client';
import { devProvider } from './dev';
import { ldapProvider } from './ldap';

/** Who the directory says the person is. Missing fields fall back to what's stored. */
export interface Identity {
  username: string;
  name?: string;
  email?: string;
  unit?: string;
  title?: string;
}

/**
 * A login backend. Add one (e.g. OIDC/SAML if IT uses that) by implementing
 * this and selecting it with AUTH_PROVIDER; sessions/users stay the same.
 */
export interface AuthProvider {
  name: string;
  /** null = wrong username/password. Throw only for infrastructure errors. */
  authenticate: (username: string, password: string) => Promise<Identity | null>;
}

export const createProvider = (config: Config, db: Db): AuthProvider =>
  config.authProvider === 'ldap' ? ldapProvider(config.ldap) : devProvider(db);
