/**
 * nova teams — team management
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, handleError, success } from '../utils.js';

export function registerTeamCommands(program) {
  const cmd = program.command('teams').description('Team and user management');

  cmd
    .command('list')
    .alias('ls')
    .description('List team members')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/users');
        const users = Array.isArray(data) ? data : (data.users || data.data || []);
        if (opts.json) { console.log(JSON.stringify(users, null, 2)); return; }
        if (users.length === 0) { console.log(chalk.gray('\n  No team members found.\n')); return; }
        console.log(createTable(
          ['Username', 'Display Name', 'Role', 'Email', 'Status'],
          users.map(u => [
            chalk.bold(u.username || '-'),
            u.displayName || u.display_name || '-',
            chalk.cyan(u.role || '-'),
            chalk.gray(u.email || '-'),
            u.isActive !== false ? chalk.green('Active') : chalk.red('Inactive'),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('invite <email>')
    .description('Invite a new team member')
    .option('-r, --role <role>', 'Role (Viewer, Engineer, Admin)', 'Engineer')
    .action(async (email, opts) => {
      try {
        await api.post('/invitations', { email, role: opts.role });
        success(`Invitation sent to ${email} as ${opts.role}`);
      } catch (err) { handleError(err); }
    });
}
