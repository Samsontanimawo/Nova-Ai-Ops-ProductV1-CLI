/**
 * nova deploy — Deployment tracking & blue-green status
 *
 * BACKEND: /api/deployments
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, statusColor, timeAgo, truncate, handleError, success } from '../utils.js';

export function registerDeploymentCommands(program) {
  const cmd = program.command('deploy').alias('deployments').description('Deployment tracking & blue-green status');

  // ── status — show blue-green environment status ────────────────────────
  cmd
    .command('status')
    .description('Show blue-green deployment status')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/deployments/status');
        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }

        const active = data.activeEnvironment || 'unknown';
        const blue = data.blue || {};
        const green = data.green || {};

        console.log('');
        console.log(`  ${chalk.bold('Blue-Green Deployment Status')}`);
        console.log(`  ${chalk.gray('Active:')}  ${active === 'blue' ? chalk.blue.bold('BLUE') : chalk.green.bold('GREEN')}`);
        if (data.lastSwitchAt) console.log(`  ${chalk.gray('Last switch:')} ${timeAgo(data.lastSwitchAt)} by ${data.lastSwitchBy || '-'}`);
        console.log('');
        console.log(createTable(
          ['Env', 'Status', 'Version', 'Port', 'Deployed', 'Deployed By'],
          [
            [chalk.blue.bold('Blue'), statusColor(blue.status)(blue.status || '-'), blue.version || '-', String(blue.port || '-'), timeAgo(blue.deployedAt), blue.deployedBy || '-'],
            [chalk.green.bold('Green'), statusColor(green.status)(green.status || '-'), green.version || '-', String(green.port || '-'), timeAgo(green.deployedAt), green.deployedBy || '-'],
          ]
        ));
      } catch (err) { handleError(err); }
    });

  // ── list — list deployment history ─────────────────────────────────────
  cmd
    .command('list')
    .alias('ls')
    .description('List deployment history')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get(`/deployments?limit=${opts.limit}`);
        const deploys = Array.isArray(data) ? data : (data.deployments || data.data || []);
        if (opts.json) { console.log(JSON.stringify(deploys, null, 2)); return; }
        if (deploys.length === 0) { console.log(chalk.gray('\n  No deployments found.\n')); return; }
        console.log(createTable(
          ['ID', 'Environment', 'Version', 'Status', 'Deployed By', 'Created'],
          deploys.map(d => [
            chalk.gray(String(d.id || '').slice(0, 8)),
            d.environment === 'blue' ? chalk.blue(d.environment) : chalk.green(d.environment || '-'),
            chalk.bold(d.version || d.tag || '-'),
            statusColor(d.status)(d.status || '-'),
            chalk.gray(d.deployedBy || d.user || '-'),
            timeAgo(d.createdAt || d.created_at || d.deployedAt),
          ])
        ));
      } catch (err) { handleError(err); }
    });
}
