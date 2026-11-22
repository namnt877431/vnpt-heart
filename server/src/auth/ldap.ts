import { Client, EqualityFilter, InvalidCredentialsError } from 'ldapts';
import type { Config } from '../config';
import type { AuthProvider } from './provider';

const first = (v: unknown): string => {
  if (Array.isArray(v)) return first(v[0]);
  if (Buffer.isBuffer(v)) return v.toString('utf8');
  return typeof v === 'string' ? v : '';
};

/**
 * LDAP / Active Directory: bind with the service account, find the user by
 * `userAttr`, then bind as that user to check the password.
 */
export const ldapProvider = (cfg: Config['ldap']): AuthProvider => ({
  name: 'ldap',
  async authenticate(username, password) {
    if (!password) return null; // an empty password would be an anonymous bind
    const client = new Client({
      url: cfg.url,
      timeout: 8000,
      connectTimeout: 8000,
      tlsOptions: { rejectUnauthorized: cfg.tlsVerify },
    });
    try {
      await client.bind(cfg.bindDn, cfg.bindPassword);
      const { searchEntries } = await client.search(cfg.baseDn, {
        scope: 'sub',
        filter: new EqualityFilter({ attribute: cfg.userAttr, value: username }),
        attributes: ['dn', 'cn', 'displayName', 'mail', 'department', 'title', 'company'],
        sizeLimit: 2,
      });
      if (searchEntries.length !== 1) return null;
      const entry = searchEntries[0];
      try {
        await client.bind(entry.dn, password);
      } catch (e) {
        if (e instanceof InvalidCredentialsError) return null;
        throw e;
      }
      return {
        username,
        name: first(entry.displayName) || first(entry.cn) || username,
        email: first(entry.mail),
        unit: first(entry.department) || first(entry.company),
        title: first(entry.title),
      };
    } finally {
      await client.unbind().catch(() => undefined);
    }
  },
});
