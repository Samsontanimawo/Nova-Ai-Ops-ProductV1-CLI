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
        const data = await api.get('/backups');
        const backups = Array.isArray(data) ? data : (data.backups || data.data || []);
        if (opts.json) { console.log(JSON.stringify(backups, null, 2)); return; }
        if (backups.length === 0) { console.log(chalk.gray('\n  No backups found.\n')); return; }
        console.log(createTable(
          ['ID', 'Type', 'Size', 'Status', 'Created'],
          backups.map(b => [
            chalk.gray(String(b.id || '').slice(0, 8)),
            chalk.cyan(b.type || b.backupType || 'full'),
            b.size || b.fileSize || '-',
            b.status === 'completed' ? chalk.green('Completed') : b.status === 'failed' ? chalk.red('Failed') : chalk.yellow(b.status || '-'),
            timeAgo(b.createdAt || b.created_at),
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
