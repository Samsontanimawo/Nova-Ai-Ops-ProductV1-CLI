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
          const user = await api.get('/auth/me');
          setConfig({ username: user.username || user.displayName, orgId: user.orgId });
          success(`Logged in as ${chalk.bold(user.username || user.displayName)} (${user.role})`);
          return;
        }

        // Interactive login
        const inquirer = (await import('inquirer')).default;
        const { url } = await inquirer.prompt([
          { type: 'input', name: 'url', message: 'Nova API URL:', default: getConfig().apiUrl }
        ]);
        setConfig({ apiUrl: url });

        const { username, password } = await inquirer.prompt([
          { type: 'input', name: 'username', message: 'Username:' },
          { type: 'password', name: 'password', message: 'Password:', mask: '*' }
        ]);

        const res = await fetch(`${url}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Login failed');
        }

        // Extract token from Set-Cookie header
        const cookies = res.headers.get('set-cookie') || '';
        const tokenMatch = cookies.match(/nova_token=([^;]+)/);
        if (tokenMatch) {
          setToken(tokenMatch[1]);
        }

        const data = await res.json();
        setConfig({ username: data.user?.username || username, orgId: data.user?.orgId });
        success(`Logged in as ${chalk.bold(data.user?.username || username)}`);
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
        const user = await api.get('/auth/me');
        console.log('');
        console.log(`  ${chalk.gray('User:')}     ${chalk.bold(user.username || user.displayName)}`);
        console.log(`  ${chalk.gray('Email:')}    ${user.email || 'N/A'}`);
        console.log(`  ${chalk.gray('Role:')}     ${user.role}`);
        console.log(`  ${chalk.gray('Org:')}      ${user.orgId || 'N/A'}`);
        console.log(`  ${chalk.gray('API:')}      ${getConfig().apiUrl}`);
        console.log('');
      } catch (err) {
        handleError(err);
      }
    });
}
