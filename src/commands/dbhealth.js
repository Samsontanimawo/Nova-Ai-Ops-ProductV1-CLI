/**
 * nova db — Database health monitoring
 *
 * BACKEND: /api/health
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { handleError } from '../utils.js';

export function registerDbHealthCommands(program) {
  program
    .command('db')
    .alias('health')
    .description('Database & system health check')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/health');
        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }

        const statusIcon = (s) => s === 'ok' || s === 'healthy' ? chalk.green('●') : s === 'degraded' ? chalk.yellow('●') : chalk.red('●');
        const statusText = (s) => s === 'ok' || s === 'healthy' ? chalk.green(s) : s === 'degraded' ? chalk.yellow(s) : chalk.red(s || 'unknown');

        console.log('');
        console.log(`  ${chalk.bold('Platform Health')} — ${statusIcon(data.status)} ${statusText(data.status)}`);
        console.log('');

        // SSL
        if (data.ssl) {
          console.log(`  ${statusIcon(data.ssl.status)} ${chalk.gray('SSL:')}  ${statusText(data.ssl.status)}  ${chalk.gray(`(${data.ssl.certificatesChecked || 0} certs checked)`)}`);
        }

        // Overload
        if (data.overload) {
          const lag = data.overload.eventLoopLagMs || 0;
          const lagColor = lag > 100 ? chalk.red : lag > 50 ? chalk.yellow : chalk.green;
          console.log(`  ${chalk.gray('●')} ${chalk.gray('Load:')} ${data.overload.activeRequests || 0} active requests  ${chalk.gray('Event loop:')} ${lagColor(lag + 'ms')}`);
        }

        // Databases (if present)
        for (const key of ['sqlite', 'postgresql', 'mongodb', 'redis']) {
          if (data[key]) {
            const db = data[key];
            console.log(`  ${statusIcon(db.status)} ${chalk.gray(key + ':')} ${statusText(db.status)} ${db.latency ? chalk.gray(`(${db.latency}ms)`) : ''}`);
          }
        }

        console.log('');
      } catch (err) { handleError(err); }
    });
}
