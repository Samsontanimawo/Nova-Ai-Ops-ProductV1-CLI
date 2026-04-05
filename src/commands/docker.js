/**
 * nova docker — Docker container monitoring
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, statusColor, handleError } from '../utils.js';

export function registerDockerCommands(program) {
  const cmd = program.command('docker').description('Docker container monitoring');

  cmd
    .command('ps')
    .alias('list')
    .description('List running containers')
    .option('--all', 'Include stopped containers')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/integrations/docker/containers');
        let containers = Array.isArray(data) ? data : (data.containers || data.data || []);
        if (!opts.all) containers = containers.filter(c => (c.state || c.status || '').toLowerCase().includes('running'));
        if (opts.json) { console.log(JSON.stringify(containers, null, 2)); return; }
        if (containers.length === 0) { console.log(chalk.gray('\n  No containers found.\n')); return; }
        console.log(createTable(
          ['Name', 'Image', 'Status', 'Ports', 'CPU', 'Memory'],
          containers.map(c => [
            chalk.bold(c.name || c.Names || '-'),
            chalk.gray(c.image || c.Image || '-'),
            statusColor(c.state || c.status)(c.state || c.status || '-'),
            chalk.gray(c.ports || c.Ports || '-'),
            c.cpuPercent || c.cpu || '-',
            c.memUsage || c.memory || '-',
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('stats')
    .description('Container resource usage')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/integrations/docker/stats');
        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const stats = data.stats || data.containers || data;
        if (Array.isArray(stats)) {
          console.log(createTable(
            ['Container', 'CPU %', 'Memory', 'Net I/O', 'Disk I/O'],
            stats.map(s => [
              chalk.bold(s.name || '-'),
              s.cpuPercent ? chalk.cyan(s.cpuPercent + '%') : '-',
              s.memUsage || '-',
              s.netIO || '-',
              s.blockIO || '-',
            ])
          ));
        } else {
          console.log(chalk.gray('\n  No container stats available.\n'));
        }
      } catch (err) { handleError(err); }
    });
}
