/**
 * nova incidents — list, create, resolve, acknowledge
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, severityColor, timeAgo, truncate, handleError, success } from '../utils.js';

export function registerIncidentCommands(program) {
  const cmd = program.command('incidents').alias('inc').description('Manage incidents');

  cmd
    .command('list')
    .alias('ls')
    .description('List incidents')
    .option('-s, --status <status>', 'Filter by status (open, resolved, investigating)')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get(`/incidents?limit=${opts.limit}${opts.status ? `&status=${opts.status}` : ''}`);
        const incidents = Array.isArray(data) ? data : (data.incidents || data.data || []);

        if (opts.json) {
          console.log(JSON.stringify(incidents, null, 2));
          return;
        }

        if (incidents.length === 0) {
          console.log(chalk.green('\n  No incidents found.\n'));
          return;
        }

        console.log(createTable(
          ['ID', 'Title', 'Severity', 'Status', 'Created'],
          incidents.map(i => [
            chalk.gray(String(i.id || '').slice(0, 8)),
            truncate(i.title || i.name || 'Untitled', 40),
            severityColor(i.severity)(i.severity || 'unknown'),
            severityColor(i.status)(i.status || 'unknown'),
            timeAgo(i.createdAt || i.created_at),
          ])
        ));
        console.log(chalk.gray(`  ${incidents.length} incident(s)\n`));
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('create')
    .description('Create a new incident')
    .requiredOption('-t, --title <title>', 'Incident title')
    .option('-s, --severity <severity>', 'Severity (critical, high, medium, low)', 'medium')
    .option('-d, --description <desc>', 'Description')
    .option('--service <service>', 'Affected service')
    .action(async (opts) => {
      try {
        const data = await api.post('/incidents', {
          title: opts.title,
          severity: opts.severity,
          description: opts.description || '',
          service: opts.service || '',
        });
        success(`Incident created: ${data.id || data.incident?.id || 'OK'}`);
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('resolve <id>')
    .description('Resolve an incident')
    .option('-n, --note <note>', 'Resolution note')
    .action(async (id, opts) => {
      try {
        await api.post(`/incidents/${id}/resolve`, { note: opts.note || '' });
        success(`Incident ${id} resolved`);
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('ack <id>')
    .alias('acknowledge')
    .description('Acknowledge an incident')
    .action(async (id) => {
      try {
        await api.post(`/incidents/${id}/acknowledge`, {});
        success(`Incident ${id} acknowledged`);
      } catch (err) {
        handleError(err);
      }
    });
}
