/**
 * nova alerts — list, ack, silence
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, severityColor, timeAgo, truncate, handleError, success } from '../utils.js';

export function registerAlertCommands(program) {
  const cmd = program.command('alerts').description('Manage alerts');

  cmd
    .command('list')
    .alias('ls')
    .description('List active alerts')
    .option('--firing', 'Show only firing alerts')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/alerts/rules');
        const raw = data.rules || data.alerts || data.data || data;
        let alerts = Array.isArray(raw) ? raw : Object.values(raw || {});

        if (opts.firing) {
          alerts = alerts.filter(a => a.state === 'firing' || a.status === 'firing');
        }

        if (opts.json) {
          console.log(JSON.stringify(alerts, null, 2));
          return;
        }

        if (alerts.length === 0) {
          console.log(chalk.green('\n  No active alerts.\n'));
          return;
        }

        console.log(createTable(
          ['Name', 'Severity', 'State', 'Service', 'Created'],
          alerts.map(a => [
            truncate(a.name || a.title || 'Unnamed', 35),
            severityColor(a.severity)(a.severity || '-'),
            severityColor(a.state || a.status)(a.state || a.status || '-'),
            chalk.gray(a.service || a.source || '-'),
            timeAgo(a.createdAt || a.created_at || a.firedAt),
          ])
        ));
        console.log(chalk.gray(`  ${alerts.length} alert(s)\n`));
      } catch (err) {
        handleError(err);
      }
    });
}
