/**
 * nova metrics — query and push custom metrics
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { handleError, success } from '../utils.js';

export function registerMetricsCommands(program) {
  const cmd = program.command('metrics').description('Query and push metrics');

  cmd
    .command('query <query>')
    .description('Query metrics (e.g., "cpu > 80")')
    .option('--last <duration>', 'Time window (1h, 6h, 24h, 7d)', '1h')
    .option('--json', 'Output as JSON')
    .action(async (query, opts) => {
      try {
        const data = await api.get(`/golden-signals?range=${opts.last}`);
        if (opts.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }
        console.log(chalk.gray(`\n  Query: ${query} (last ${opts.last})`));
        console.log(chalk.gray('  Results from golden signals:\n'));
        if (data.signals) {
          for (const [key, value] of Object.entries(data.signals)) {
            console.log(`  ${chalk.bold(key)}: ${chalk.cyan(JSON.stringify(value))}`);
          }
        } else {
          console.log(chalk.gray('  No matching data'));
        }
        console.log('');
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('push <name> <value>')
    .description('Push a custom metric')
    .option('--tags <tags>', 'Comma-separated tags')
    .action(async (name, value, opts) => {
      try {
        await api.post('/metrics/custom', {
          name,
          value: parseFloat(value),
          tags: opts.tags ? opts.tags.split(',').map(t => t.trim()) : [],
          timestamp: new Date().toISOString(),
        });
        success(`Metric pushed: ${name} = ${value}`);
      } catch (err) {
        handleError(err);
      }
    });
}
