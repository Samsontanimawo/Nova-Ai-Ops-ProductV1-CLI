/**
 * nova slo — check SLO compliance and error budgets
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, handleError } from '../utils.js';

export function registerSLOCommands(program) {
  const cmd = program.command('slo').description('SLO compliance and error budgets');

  cmd
    .command('check')
    .description('Check SLO compliance for all services')
    .option('--service <name>', 'Filter by service name')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/services');
        let services = Array.isArray(data) ? data : (data.services || data.data || []);

        if (opts.service) {
          services = services.filter(s => (s.name || '').toLowerCase().includes(opts.service.toLowerCase()));
        }

        if (opts.json) {
          const sloData = services.map(s => ({
            name: s.name,
            sloTarget: 99.9,
            sloActual: parseFloat(s.sloCompliance || 0),
            status: parseFloat(s.sloCompliance || 0) >= 99.9 ? 'meeting' : 'breaching',
          }));
          console.log(JSON.stringify(sloData, null, 2));
          return;
        }

        console.log(createTable(
          ['Service', 'SLO Target', 'Actual', 'Status', 'Error Budget'],
          services.map(s => {
            const actual = parseFloat(s.sloCompliance || 0);
            const target = 99.9;
            const meeting = actual >= target;
            const budgetPct = Math.max(0, ((actual - target) / (100 - target)) * 100).toFixed(1);
            return [
              chalk.bold(s.name),
              chalk.gray(`${target}%`),
              meeting ? chalk.green(`${actual}%`) : chalk.red(`${actual}%`),
              meeting ? chalk.green('Meeting') : chalk.red('Breaching'),
              meeting ? chalk.green(`${budgetPct}% remaining`) : chalk.red('Exhausted'),
            ];
          })
        ));
      } catch (err) {
        handleError(err);
      }
    });
}
