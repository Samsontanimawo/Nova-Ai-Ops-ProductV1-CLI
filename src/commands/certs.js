/**
 * nova certs — SSL/TLS certificate management
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, handleError } from '../utils.js';

export function registerCertCommands(program) {
  program
    .command('certs')
    .alias('certificates')
    .description('SSL/TLS certificate status')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/site-audit/ssl');
        const certs = data.certificates || [];
        if (opts.json) { console.log(JSON.stringify(certs, null, 2)); return; }
        if (certs.length === 0) { console.log(chalk.gray('\n  No certificates found.\n')); return; }
        console.log(createTable(
          ['Domain', 'Issuer', 'Days Left', 'Expiry', 'Status'],
          certs.map(c => {
            const days = c.daysRemaining || 0;
            const color = days > 30 ? chalk.green : days > 7 ? chalk.yellow : chalk.red;
            return [
              chalk.bold(c.domain),
              chalk.gray(c.issuer || 'Unknown'),
              color(String(days)),
              c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : '-',
              color(c.status || (c.valid ? 'Valid' : 'Invalid')),
            ];
          })
        ));
      } catch (err) { handleError(err); }
    });
}
