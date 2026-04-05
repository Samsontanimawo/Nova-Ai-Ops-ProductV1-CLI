/**
 * nova freeze — change freeze / maintenance windows
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, handleError, success } from '../utils.js';

export function registerChangeFreezeCommands(program) {
  const cmd = program.command('freeze').alias('maintenance').description('Change freezes & maintenance windows');

  cmd
    .command('list')
    .alias('ls')
    .description('List active and upcoming change freezes')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/change-windows');
        const windows = Array.isArray(data) ? data : (data.windows || data.freezes || data.data || []);
        if (opts.json) { console.log(JSON.stringify(windows, null, 2)); return; }
        if (windows.length === 0) { console.log(chalk.green('\n  No active change freezes.\n')); return; }
        console.log(createTable(
          ['Name', 'Start', 'End', 'Type', 'Status'],
          windows.map(w => [
            chalk.bold(w.name || w.title || '-'),
            w.startTime || w.start || '-',
            w.endTime || w.end || '-',
            chalk.gray(w.type || 'freeze'),
            w.active ? chalk.red.bold('ACTIVE') : chalk.gray('Scheduled'),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('create')
    .description('Create a change freeze')
    .requiredOption('-n, --name <name>', 'Freeze name')
    .requiredOption('--start <datetime>', 'Start (ISO format)')
    .requiredOption('--end <datetime>', 'End (ISO format)')
    .option('--reason <text>', 'Reason for freeze')
    .action(async (opts) => {
      try {
        await api.post('/change-windows', {
          name: opts.name,
          startTime: opts.start,
          endTime: opts.end,
          reason: opts.reason || '',
          type: 'freeze',
        });
        success(`Change freeze created: ${opts.name}`);
      } catch (err) { handleError(err); }
    });

  cmd
    .command('check')
    .description('Check if a change freeze is currently active')
    .action(async () => {
      try {
        const data = await api.get('/change-windows');
        const windows = Array.isArray(data) ? data : (data.windows || data.freezes || []);
        const active = windows.filter(w => w.active);
        if (active.length > 0) {
          console.log(chalk.red.bold('\n  ⚠ CHANGE FREEZE ACTIVE\n'));
          for (const w of active) {
            console.log(`  ${chalk.red('●')} ${chalk.bold(w.name)} — until ${w.endTime || w.end}`);
            if (w.reason) console.log(`    ${chalk.gray(w.reason)}`);
          }
          console.log('');
          process.exit(1); // Non-zero exit for CI/CD gating
        } else {
          console.log(chalk.green('\n  ✓ No active change freezes. Safe to deploy.\n'));
        }
      } catch (err) { handleError(err); }
    });
}
