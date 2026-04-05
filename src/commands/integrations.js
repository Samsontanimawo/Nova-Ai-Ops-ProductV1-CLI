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
        const integrations = Array.isArray(data) ? data : (data.integrations || data.data || []);
        if (opts.json) { console.log(JSON.stringify(integrations, null, 2)); return; }
        if (integrations.length === 0) { console.log(chalk.gray('\n  No integrations configured.\n')); return; }
        console.log(createTable(
          ['Integration', 'Status', 'Type', 'Last Sync'],
          integrations.map(i => [
            chalk.bold(i.name || i.integration || '-'),
            statusColor(i.status)(i.status || '-'),
            chalk.gray(i.type || i.provider || '-'),
            i.lastSync || i.last_sync || chalk.gray('Never'),
          ])
        ));
      } catch (err) { handleError(err); }
    });
}
