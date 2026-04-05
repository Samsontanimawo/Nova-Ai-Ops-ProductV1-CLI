/**
 * nova oncall — on-call schedules and roster
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, handleError, success } from '../utils.js';

export function registerOnCallCommands(program) {
  const cmd = program.command('oncall').description('On-call schedules and roster');

  cmd
    .command('who')
    .description('Show who is currently on-call')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/oncall');
        const roster = Array.isArray(data) ? data : (data.schedules || data.roster || data.data || []);
        if (opts.json) { console.log(JSON.stringify(roster, null, 2)); return; }
        if (roster.length === 0) { console.log(chalk.gray('\n  No on-call schedules configured.\n')); return; }
        console.log(chalk.bold('\n  On-Call Roster\n'));
        for (const r of roster) {
          const name = r.currentUser || r.user || r.name || 'Unassigned';
          const team = r.team || r.schedule || '-';
          console.log(`  ${chalk.green('●')} ${chalk.bold(name)} — ${chalk.gray(team)} ${r.until ? chalk.gray(`until ${new Date(r.until).toLocaleString()}`) : ''}`);
        }
        console.log('');
      } catch (err) { handleError(err); }
    });

  cmd
    .command('list')
    .alias('ls')
    .description('List all on-call schedules')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/oncall/schedules');
        const schedules = Array.isArray(data) ? data : (data.schedules || data.data || []);
        if (opts.json) { console.log(JSON.stringify(schedules, null, 2)); return; }
        if (schedules.length === 0) { console.log(chalk.gray('\n  No schedules found.\n')); return; }
        console.log(createTable(
          ['Schedule', 'Team', 'Current', 'Rotation', 'Next Handoff'],
          schedules.map(s => [
            chalk.bold(s.name || '-'),
            chalk.gray(s.team || '-'),
            chalk.cyan(s.currentUser || s.current || '-'),
            chalk.gray(s.rotation || s.frequency || '-'),
            s.nextHandoff || s.next_handoff || chalk.gray('-'),
          ])
        ));
      } catch (err) { handleError(err); }
    });
}
