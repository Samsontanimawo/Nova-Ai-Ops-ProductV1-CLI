/**
 * nova reports — Scheduled reports (incident summaries, SLO, infrastructure)
 *
 * BACKEND: /api/reports
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, truncate, timeAgo, handleError, success } from '../utils.js';

export function registerReportCommands(program) {
  const cmd = program.command('reports').alias('report').description('Scheduled reports');

  // ── list — list reports ────────────────────────────────────────────────
  cmd
    .command('list')
    .alias('ls')
    .description('List scheduled reports')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/reports');
        const reports = Array.isArray(data) ? data : (data.reports || data.data || []);
        if (opts.json) { console.log(JSON.stringify(reports, null, 2)); return; }
        if (reports.length === 0) { console.log(chalk.gray('\n  No scheduled reports.\n')); return; }
        console.log(createTable(
          ['ID', 'Name', 'Type', 'Schedule', 'Last Run', 'Status'],
          reports.map(r => [
            chalk.gray(String(r.id || '').slice(0, 8)),
            chalk.bold(truncate(r.name || r.title || '-', 30)),
            chalk.cyan(r.type || r.reportType || '-'),
            chalk.gray(r.schedule || r.cron || '-'),
            timeAgo(r.lastRunAt || r.last_run_at),
            r.status === 'active' ? chalk.green(r.status) : chalk.gray(r.status || '-'),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  // ── run — trigger a report ─────────────────────────────────────────────
  cmd
    .command('run <id>')
    .description('Run a report now')
    .action(async (id) => {
      try {
        await api.post(`/reports/${id}/run`, {});
        success(`Report ${id} triggered`);
      } catch (err) { handleError(err); }
    });
}
