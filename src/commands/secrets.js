/**
 * nova secrets — Secrets & credentials management (Secreta)
 *
 * PURPOSE: CLI interface to the Nova Secreta vault for managing secrets,
 *          credentials, API keys, and sensitive configuration.
 *
 * BACKEND: /api/secreta — requires Founder role
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, truncate, handleError, success } from '../utils.js';

export function registerSecretCommands(program) {
  const cmd = program
    .command('secrets')
    .alias('secret')
    .description('Secrets & credentials management (Secreta)');

  // ── list ──────────────────────────────────────────────────────────────────
  cmd
    .command('list')
    .alias('ls')
    .description('List all secrets')
    .option('--source <source>', 'Filter by source (vault|env)')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const query = opts.source ? `?source=${opts.source}` : '';
        const data = await api.get(`/secreta/secrets${query}`);
        const secrets = Array.isArray(data) ? data : (data.secrets || data.data || []);

        if (opts.json) { console.log(JSON.stringify(secrets, null, 2)); return; }

        if (secrets.length === 0) {
          console.log(chalk.gray('\n  No secrets found.\n'));
          return;
        }

        console.log(createTable(
          ['Name', 'Type', 'Source', 'Status', 'Last Rotated'],
          secrets.map(s => [
            chalk.bold(truncate(s.name || s.envKey || '-', 40)),
            chalk.gray(s.type || '-'),
            s.source === 'vault' ? chalk.cyan(s.source) : chalk.yellow(s.source || '-'),
            s.status === 'active' ? chalk.green(s.status) : chalk.red(s.status || '-'),
            chalk.gray(s.lastRotated || '-'),
          ])
        ));
        console.log(chalk.gray(`  ${secrets.length} secret(s)\n`));
      } catch (err) { handleError(err); }
    });

  // ── status ────────────────────────────────────────────────────────────────
  cmd
    .command('status')
    .description('Vault health and migration status')
    .action(async () => {
      try {
        const data = await api.get('/secreta/status');
        console.log('');
        console.log(`  ${chalk.bold('Vault Status')}`);
        console.log(`  ${chalk.gray('Total secrets:')}   ${data.total ?? '-'}`);
        console.log(`  ${chalk.gray('Vault secrets:')}   ${data.vault ?? '-'}`);
        console.log(`  ${chalk.gray('Env secrets:')}     ${data.env ?? '-'}`);
        console.log(`  ${chalk.gray('Migration:')}       ${data.migrationComplete ? chalk.green('complete') : chalk.yellow('pending')}`);
        console.log('');
      } catch (err) { handleError(err); }
    });

  // ── reveal ────────────────────────────────────────────────────────────────
  cmd
    .command('reveal <id>')
    .description('Reveal a secret value')
    .action(async (id) => {
      try {
        const data = await api.get(`/secreta/secrets/${encodeURIComponent(id)}/reveal`);
        const secret = data.secret || data;
        console.log('');
        console.log(`  ${chalk.bold(secret.name || secret.envKey || id)}`);
        console.log(`  ${chalk.gray('Value:')} ${secret.value || '-'}`);
        console.log(`  ${chalk.gray('Type:')}  ${secret.type || '-'}`);
        console.log('');
      } catch (err) { handleError(err); }
    });

  // ── rotate ────────────────────────────────────────────────────────────────
  cmd
    .command('rotate <id> <value>')
    .description('Rotate a secret value')
    .action(async (id, value) => {
      try {
        await api.put(`/secreta/secrets/${encodeURIComponent(id)}/rotate`, { value });
        success(`Secret ${id} rotated successfully.`);
      } catch (err) { handleError(err); }
    });

  // ── delete ────────────────────────────────────────────────────────────────
  cmd
    .command('delete <id>')
    .alias('rm')
    .description('Delete a secret')
    .action(async (id) => {
      try {
        await api.delete(`/secreta/secrets/${encodeURIComponent(id)}`);
        success(`Secret ${id} deleted.`);
      } catch (err) { handleError(err); }
    });

  // ── versions ──────────────────────────────────────────────────────────────
  cmd
    .command('versions <id>')
    .description('List secret version history')
    .action(async (id) => {
      try {
        const data = await api.get(`/secreta/secrets/${encodeURIComponent(id)}/versions`);
        const versions = data.versions || data || [];

        if (!Array.isArray(versions) || versions.length === 0) {
          console.log(chalk.gray('\n  No versions found.\n'));
          return;
        }

        console.log(createTable(
          ['Version', 'Date', 'Rotated By'],
          versions.map(v => [
            chalk.bold(`v${v.version}`),
            chalk.gray(v.date || '-'),
            v.rotatedBy || '-',
          ])
        ));
      } catch (err) { handleError(err); }
    });
}
