/**
 * nova integrations — check integration status
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, statusColor, handleError } from '../utils.js';

export function registerIntegrationCommands(program) {
  program
    .command('integrations')
    .alias('int')
    .description('Check integration status')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/integrations');
        const raw = data.integrations || data.data || data;
        // API returns { integrations: { docker: {...}, slack: {...}, ... } } — normalize to array
        const integrations = Array.isArray(raw) ? raw : Object.entries(raw).map(([key, val]) => ({ name: key, ...val }));
        if (opts.json) { console.log(JSON.stringify(integrations, null, 2)); return; }
        if (integrations.length === 0) { console.log(chalk.gray('\n  No integrations configured.\n')); return; }
        console.log(createTable(
          ['Integration', 'Status', 'Type', 'Enabled'],
          integrations.map(i => [
            chalk.bold(i.name || i.integration || '-'),
            i.enabled ? chalk.green('connected') : chalk.gray('disabled'),
            chalk.gray(i.type || i.provider || '-'),
            i.enabled ? chalk.green('Yes') : chalk.gray('No'),
          ])
        ));
      } catch (err) { handleError(err); }
    });
}
