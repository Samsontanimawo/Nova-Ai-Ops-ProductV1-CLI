/**
 * nova playbooks — Remediation playbooks
 *
 * BACKEND: /api/playbooks
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, truncate, timeAgo, handleError, success } from '../utils.js';

export function registerPlaybookCommands(program) {
  const cmd = program.command('playbooks').alias('pb').description('Remediation playbooks');

  // ── list ───────────────────────────────────────────────────────────────
  cmd
    .command('list')
    .alias('ls')
    .description('List playbooks')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/playbooks');
        const playbooks = Array.isArray(data) ? data : (data.playbooks || data.data || []);
        if (opts.json) { console.log(JSON.stringify(playbooks, null, 2)); return; }
        if (playbooks.length === 0) { console.log(chalk.gray('\n  No playbooks found.\n')); return; }
        console.log(createTable(
          ['ID', 'Name', 'Trigger', 'Steps', 'Last Run'],
          playbooks.map(p => [
            chalk.gray(String(p.id || '').slice(0, 8)),
            chalk.bold(truncate(p.name || p.title || '-', 35)),
            chalk.cyan(p.trigger || p.triggerType || '-'),
            String(p.steps?.length || p.stepCount || '-'),
            timeAgo(p.lastRunAt || p.last_run_at),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  // ── run ────────────────────────────────────────────────────────────────
  cmd
    .command('run <id>')
    .description('Execute a playbook')
    .option('--target <service>', 'Target service')
    .option('--dry-run', 'Preview without executing')
    .action(async (id, opts) => {
      try {
        const data = await api.post(`/playbooks/${id}/execute`, {
          target: opts.target || '',
          dryRun: opts.dryRun || false,
        });
        if (opts.dryRun) console.log(chalk.yellow('\n  [DRY RUN] — no changes made\n'));
        success(`Playbook ${id} ${opts.dryRun ? 'previewed' : 'executed'}`);
        if (data.output) console.log(chalk.gray(data.output));
      } catch (err) { handleError(err); }
    });
}
