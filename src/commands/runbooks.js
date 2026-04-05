/**
 * nova runbooks — list, run, inspect
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, truncate, handleError, success } from '../utils.js';

export function registerRunbookCommands(program) {
  const cmd = program.command('runbooks').alias('rb').description('Manage AI runbooks');

  cmd
    .command('list')
    .alias('ls')
    .description('List available runbooks')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/runbooks/history');
        const runbooks = Array.isArray(data) ? data : (data.runbooks || data.data || []);

        if (opts.json) {
          console.log(JSON.stringify(runbooks, null, 2));
          return;
        }

        if (runbooks.length === 0) {
          console.log(chalk.gray('\n  No runbooks found.\n'));
          return;
        }

        console.log(createTable(
          ['ID', 'Name', 'Type', 'Steps', 'Last Run'],
          runbooks.map(r => [
            chalk.gray(String(r.id || '').slice(0, 8)),
            chalk.bold(truncate(r.name || r.title || 'Untitled', 35)),
            chalk.gray(r.type || r.category || '-'),
            String(r.steps?.length || r.stepCount || '-'),
            r.lastRunAt || r.last_run_at || chalk.gray('Never'),
          ])
        ));
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('run <id>')
    .description('Execute a runbook')
    .option('--target <target>', 'Target service or host')
    .option('--dry-run', 'Preview without executing')
    .action(async (id, opts) => {
      try {
        const data = await api.post(`/runbooks/${id}/execute`, {
          target: opts.target || '',
          dryRun: opts.dryRun || false,
        });
        if (opts.dryRun) {
          console.log(chalk.yellow('\n  [DRY RUN] — no changes made\n'));
        }
        success(`Runbook ${id} ${opts.dryRun ? 'previewed' : 'executed'} successfully`);
        if (data.output) console.log(chalk.gray(data.output));
      } catch (err) {
        handleError(err);
      }
    });
}
