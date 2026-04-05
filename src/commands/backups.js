/**
 * nova backups — database backup management
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, timeAgo, handleError, success } from '../utils.js';

export function registerBackupCommands(program) {
  const cmd = program.command('backups').alias('backup').description('Database backup management');

  cmd
    .command('list')
    .alias('ls')
    .description('List all backups')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/database-vault/history');
        const backups = Array.isArray(data) ? data : (data.backups || data.data || []);
        if (opts.json) { console.log(JSON.stringify(backups, null, 2)); return; }
        if (backups.length === 0) { console.log(chalk.gray('\n  No backups found.\n')); return; }
        console.log(createTable(
          ['Filename', 'Size', 'Date', 'Time'],
          backups.map(b => [
            chalk.bold(b.filename || b.id || '-'),
            chalk.cyan(b.sizeFormatted || b.size || b.fileSize || '-'),
            chalk.gray(b.date || '-'),
            chalk.gray(b.time || '-'),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('create')
    .description('Create a new backup')
    .option('--type <type>', 'Backup type (full, incremental)', 'full')
    .action(async (opts) => {
      try {
        const data = await api.post('/backups', { type: opts.type });
        success(`Backup created: ${data.id || data.backupId || 'OK'}`);
      } catch (err) { handleError(err); }
    });

  cmd
    .command('restore <id>')
    .description('Restore from a backup')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (id, opts) => {
      try {
        if (!opts.confirm) {
          const inquirer = (await import('inquirer')).default;
          const { proceed } = await inquirer.prompt([{ type: 'confirm', name: 'proceed', message: `Restore from backup ${id}? This will overwrite current data.`, default: false }]);
          if (!proceed) { console.log(chalk.gray('\n  Cancelled.\n')); return; }
        }
        await api.post(`/backups/${id}/restore`, {});
        success(`Restore from backup ${id} initiated`);
      } catch (err) { handleError(err); }
    });
}
