/**
 * nova correlations — Incident correlation engine
 *
 * BACKEND: /api/correlations
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, severityColor, truncate, timeAgo, handleError } from '../utils.js';

export function registerCorrelationCommands(program) {
  const cmd = program.command('correlations').alias('corr').description('Incident correlation engine');

  // ── stats — correlation statistics ─────────────────────────────────────
  cmd
    .command('stats')
    .description('Correlation engine statistics')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/correlations/stats');
        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }

        console.log('');
        console.log(`  ${chalk.bold('Correlation Engine')}`);
        console.log(`  ${chalk.gray('Total correlations:')} ${chalk.bold(String(data.totalCorrelations || 0))}`);

        const byType = data.byType || [];
        if (byType.length) {
          console.log('');
          for (const t of byType) {
            console.log(`  ${chalk.gray(t.type || '-')}  ${chalk.cyan(String(t.count || 0))}`);
          }
        }

        const recent = data.recentCorrelations || [];
        if (recent.length) {
          console.log('');
          console.log(`  ${chalk.bold('Recent Correlations')}`);
          console.log(createTable(
            ['ID', 'Type', 'Incidents', 'Created'],
            recent.map(c => [
              chalk.gray(String(c.id || '').slice(0, 8)),
              chalk.cyan(c.type || '-'),
              String(c.incidentCount || c.incidents?.length || '-'),
              timeAgo(c.createdAt || c.created_at),
            ])
          ));
        } else {
          console.log(chalk.gray('\n  No correlations detected yet.\n'));
        }
        console.log('');
      } catch (err) { handleError(err); }
    });

  // ── incident — find correlations for an incident ───────────────────────
  cmd
    .command('incident <id>')
    .description('Find correlations for an incident')
    .option('--json', 'Output as JSON')
    .action(async (id) => {
      try {
        const numericId = id.replace(/^INC-/i, '');
        const data = await api.get(`/correlations/incident/${numericId}`);
        const correlations = data.correlations || data.data || [];

        if (!correlations.length) {
          console.log(chalk.gray(`\n  No correlations found for incident ${id}.\n`));
          return;
        }

        console.log(createTable(
          ['Correlated Incident', 'Similarity', 'Type', 'Title'],
          correlations.map(c => [
            chalk.gray(String(c.incidentId || c.id || '-')),
            chalk.cyan(`${Math.round((c.similarity || c.score || 0) * 100)}%`),
            chalk.gray(c.type || '-'),
            truncate(c.title || '-', 40),
          ])
        ));
      } catch (err) { handleError(err); }
    });
}
