/**
 * nova synthetic — synthetic monitoring checks
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, statusColor, timeAgo, handleError, success } from '../utils.js';

export function registerSyntheticCommands(program) {
  const cmd = program.command('synthetic').alias('synth').description('Synthetic monitoring');

  cmd
    .command('list')
    .alias('ls')
    .description('List synthetic checks')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/synthetic/monitors');
        const checks = Array.isArray(data) ? data : (data.checks || data.monitors || data.data || []);
        if (opts.json) { console.log(JSON.stringify(checks, null, 2)); return; }
        if (checks.length === 0) { console.log(chalk.gray('\n  No synthetic checks configured.\n')); return; }
        console.log(createTable(
          ['Name', 'URL', 'Status', 'Response', 'Last Check'],
          checks.map(c => [
            chalk.bold(c.name || '-'),
            chalk.gray(c.url || c.endpoint || '-'),
            statusColor(c.status)(c.status || '-'),
            `${c.responseTime || c.response_time || '-'}ms`,
            timeAgo(c.lastCheck || c.last_check || c.lastRun),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('run <id>')
    .description('Run a synthetic monitor check now')
    .action(async (id) => {
      try {
        await api.post(`/synthetic/monitors/${encodeURIComponent(id)}/run`, {});
        success(`Synthetic monitor ${id} triggered`);
      } catch (err) { handleError(err); }
    });
}
