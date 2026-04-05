/**
 * nova apikeys — API key management
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, timeAgo, truncate, handleError, success } from '../utils.js';

export function registerApiKeyCommands(program) {
  const cmd = program.command('apikeys').alias('keys').description('API key management');

  cmd
    .command('list')
    .alias('ls')
    .description('List API keys')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/api-keys');
        const keys = Array.isArray(data) ? data : (data.keys || data.apiKeys || data.data || []);
        if (opts.json) { console.log(JSON.stringify(keys, null, 2)); return; }
        if (keys.length === 0) { console.log(chalk.gray('\n  No API keys found.\n')); return; }
        console.log(createTable(
          ['Name', 'Key (prefix)', 'Scopes', 'Last Used', 'Created'],
          keys.map(k => [
            chalk.bold(k.name || k.label || '-'),
            chalk.gray(truncate(k.keyPrefix || k.key || k.token || '-', 16) + '...'),
            chalk.cyan(Array.isArray(k.scopes) ? k.scopes.join(', ') : (k.scopes || 'all')),
            timeAgo(k.lastUsed || k.last_used),
            timeAgo(k.createdAt || k.created_at),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('create')
    .description('Create a new API key')
    .requiredOption('-n, --name <name>', 'Key name')
    .option('--scopes <scopes>', 'Comma-separated scopes', 'read')
    .option('--expires <days>', 'Expiry in days (0 = never)', '0')
    .action(async (opts) => {
      try {
        const data = await api.post('/api-keys', {
          name: opts.name,
          scopes: opts.scopes.split(',').map(s => s.trim()),
          expiresInDays: parseInt(opts.expires),
        });
        console.log('');
        console.log(chalk.green.bold('  API Key Created'));
        console.log(chalk.gray('  ─────────────────'));
        console.log(`  ${chalk.gray('Name:')}  ${opts.name}`);
        console.log(`  ${chalk.gray('Key:')}   ${chalk.yellow.bold(data.key || data.token || data.apiKey)}`);
        console.log('');
        console.log(chalk.red('  Save this key now — it won\'t be shown again.'));
        console.log('');
      } catch (err) { handleError(err); }
    });

  cmd
    .command('revoke <id>')
    .description('Revoke an API key')
    .action(async (id) => {
      try {
        await api.delete(`/api-keys/${id}`);
        success(`API key ${id} revoked`);
      } catch (err) { handleError(err); }
    });
}
