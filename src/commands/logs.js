/**
 * nova logs — search and tail logs
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, truncate, timeAgo, handleError } from '../utils.js';

export function registerLogCommands(program) {
  const cmd = program.command('logs').description('Search and explore logs');

  cmd
    .command('search <query>')
    .description('Search logs by keyword')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--service <name>', 'Filter by service')
    .option('--level <level>', 'Filter by level (error, warn, info, debug)')
    .option('--last <duration>', 'Time window (1h, 6h, 24h, 7d)', '1h')
    .option('--json', 'Output as JSON')
    .action(async (query, opts) => {
      try {
        const params = new URLSearchParams({ query, limit: opts.limit, range: opts.last });
        if (opts.service) params.set('service', opts.service);
        if (opts.level) params.set('level', opts.level);
        const data = await api.get(`/logs/explorer?${params}`);
        const logs = Array.isArray(data) ? data : (data.logs || data.entries || data.data || []);
        if (opts.json) { console.log(JSON.stringify(logs, null, 2)); return; }
        if (logs.length === 0) { console.log(chalk.gray('\n  No logs found.\n')); return; }
        console.log(createTable(
          ['Time', 'Level', 'Service', 'Message'],
          logs.map(l => [
            timeAgo(l.timestamp || l.time),
            l.level === 'error' ? chalk.red(l.level) : l.level === 'warn' ? chalk.yellow(l.level) : chalk.gray(l.level || '-'),
            chalk.cyan(truncate(l.service || l.source || '-', 20)),
            truncate(l.message || l.msg || '', 60),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('tail')
    .description('Stream recent logs')
    .option('--service <name>', 'Filter by service')
    .option('--level <level>', 'Minimum level')
    .action(async (opts) => {
      try {
        console.log(chalk.gray('\n  Streaming logs (Ctrl+C to stop)...\n'));
        const poll = async () => {
          const params = new URLSearchParams({ limit: '10', range: '1m' });
          if (opts.service) params.set('service', opts.service);
          if (opts.level) params.set('level', opts.level);
          const data = await api.get(`/logs/explorer?${params}`);
          const logs = Array.isArray(data) ? data : (data.logs || data.entries || []);
          for (const l of logs) {
            const lvl = (l.level || 'info').toUpperCase().padEnd(5);
            const color = l.level === 'error' ? chalk.red : l.level === 'warn' ? chalk.yellow : chalk.gray;
            console.log(`  ${chalk.gray(new Date(l.timestamp || Date.now()).toLocaleTimeString())} ${color(lvl)} ${chalk.cyan(l.service || '-')} ${l.message || ''}`);
          }
        };
        await poll();
        setInterval(poll, 5000);
      } catch (err) { handleError(err); }
    });
}
