/**
 * nova services — list, health, inspect
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, statusColor, truncate, handleError } from '../utils.js';

export function registerServiceCommands(program) {
  const cmd = program.command('services').alias('svc').description('Manage services');

  cmd
    .command('list')
    .alias('ls')
    .description('List all services')
    .option('-s, --status <status>', 'Filter by status')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/services');
        let services = Array.isArray(data) ? data : (data.services || data.data || []);

        if (opts.status) {
          services = services.filter(s => (s.status || '').toLowerCase() === opts.status.toLowerCase());
        }

        if (opts.json) {
          console.log(JSON.stringify(services, null, 2));
          return;
        }

        if (services.length === 0) {
          console.log(chalk.gray('\n  No services found.\n'));
          return;
        }

        console.log(createTable(
          ['Name', 'Status', 'Type', 'Region', 'RPS', 'P99 (ms)', 'Error %'],
          services.map(s => [
            chalk.bold(truncate(s.name, 30)),
            statusColor(s.status)(s.status || 'unknown'),
            chalk.gray(s.type || '-'),
            chalk.gray(s.region || '-'),
            String(s.requestsPerSec ?? s.rps ?? '-'),
            String(s.latencyP99 ?? s.p99 ?? '-'),
            s.errorRate ? (parseFloat(s.errorRate) > 1 ? chalk.red(s.errorRate + '%') : chalk.green(s.errorRate + '%')) : '-',
          ])
        ));
        console.log(chalk.gray(`  ${services.length} service(s)\n`));
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('health [name]')
    .description('Check service health (or all services)')
    .action(async (name) => {
      try {
        const data = await api.get('/services');
        let services = Array.isArray(data) ? data : (data.services || data.data || []);

        if (name) {
          services = services.filter(s => (s.name || '').toLowerCase().includes(name.toLowerCase()));
        }

        for (const s of services) {
          const color = statusColor(s.status);
          console.log(`  ${color('●')} ${chalk.bold(s.name)} — ${color(s.status || 'unknown')}  ${chalk.gray(`SLO: ${s.sloCompliance || '-'}%  P99: ${s.latencyP99 || '-'}ms`)}`);
        }
        console.log('');
      } catch (err) {
        handleError(err);
      }
    });
}
