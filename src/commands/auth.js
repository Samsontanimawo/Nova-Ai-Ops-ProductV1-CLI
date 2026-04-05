/**
 * nova login / logout / whoami
 */

import chalk from 'chalk';
import { createRequire } from 'module';
import { getConfig, setConfig, setToken, clearToken, getToken } from '../config.js';
import { api } from '../api.js';
import { success, handleError } from '../utils.js';

export function registerAuthCommands(program) {
  program
    .command('login')
    .description('Authenticate with Nova AI Ops')
    .option('-u, --url <url>', 'API base URL')
    .option('-t, --token <token>', 'Auth token (or paste from browser)')
    .action(async (opts) => {
      try {
        if (opts.url) setConfig({ apiUrl: opts.url });

        if (opts.token) {
          setToken(opts.token);
          // Verify token
          const data = await api.get('/auth/me');
          const user = data.user || data;
          setConfig({ username: user.username || user.displayName, orgId: user.orgId });
          success(`Logged in as ${chalk.bold(user.displayName || user.username)} (${user.role})`);
          return;
        }

        // Interactive login
        const inquirer = (await import('inquirer')).default;

        // Only prompt for URL if --url was not provided
        let apiUrl = opts.url || getConfig().apiUrl;
        if (!opts.url) {
          const { url } = await inquirer.prompt([
            { type: 'input', name: 'url', message: 'Nova API URL:', default: apiUrl }
          ]);
          apiUrl = url;
        }
        // Ensure URL ends with /api
        if (!apiUrl.endsWith('/api')) {
          apiUrl = apiUrl.replace(/\/+$/, '') + '/api';
        }
        setConfig({ apiUrl });

        const { username, password } = await inquirer.prompt([
          { type: 'input', name: 'username', message: 'Username:' },
          { type: 'password', name: 'password', message: 'Password:', mask: '*' }
        ]);

        const res = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          redirect: 'manual',
        });

        if (!res.ok && res.status !== 302) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.message || `Login failed (HTTP ${res.status})`);
        }

        // Extract token from Set-Cookie header
        const cookies = res.headers.get('set-cookie') || '';
        const tokenMatch = cookies.match(/nova_token=([^;]+)/);
        if (tokenMatch) {
          setToken(tokenMatch[1]);
        } else {
          // Try to get token from response body
          const data = await res.json().catch(() => ({}));
          if (data.token) {
            setToken(data.token);
          }
        }

        const token = getToken();
        if (!token) {
          throw new Error('Login succeeded but no token received. Try: nova login --token <token-from-browser>');
        }

        // Verify the token works
        try {
          const meData = await api.get('/auth/me');
          const me = meData.user || meData;
          setConfig({ username: me.username || me.displayName || username, orgId: me.orgId });
          success(`Logged in as ${chalk.bold(me.displayName || me.username || username)} (${me.role || 'User'})`);
        } catch {
          setConfig({ username, orgId: null });
          success(`Logged in as ${chalk.bold(username)}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  program
    .command('logout')
    .description('Log out and clear credentials')
    .action(() => {
      clearToken();
      success('Logged out');
    });

  program
    .command('whoami')
    .description('Show current authenticated user')
    .action(async () => {
      try {
        const token = getToken();
        if (!token) {
          console.log(chalk.yellow('\n  Not logged in. Run: nova login\n'));
          return;
        }
        const data = await api.get('/auth/me');
        const user = data.user || data;

        // Resolve org name from orgId
        let orgDisplay = user.orgName || user.orgId || 'N/A';
        if (user.orgId && !user.orgName) {
          try {
            const orgsData = await api.get('/v1/organizations');
            const orgs = orgsData.organizations || [];
            const match = orgs.find(o => o.orgId === user.orgId || o.id === user.orgId);
            if (match) orgDisplay = match.name;
          } catch { /* fall back to orgId */ }
        }

        console.log('');
        console.log(`  ${chalk.gray('User:')}     ${chalk.bold(user.displayName || user.username)}`);
        console.log(`  ${chalk.gray('Email:')}    ${user.email || 'N/A'}`);
        console.log(`  ${chalk.gray('Role:')}     ${user.role}`);
        console.log(`  ${chalk.gray('Org:')}      ${orgDisplay}`);
        console.log(`  ${chalk.gray('API:')}      ${getConfig().apiUrl}`);
        console.log('');
      } catch (err) {
        handleError(err);
      }
    });
}
