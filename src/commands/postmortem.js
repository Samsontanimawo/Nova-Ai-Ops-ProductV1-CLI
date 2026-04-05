/**
 * nova postmortem — post-incident reviews
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, truncate, timeAgo, handleError, success } from '../utils.js';

export function registerPostmortemCommands(program) {
  const cmd = program.command('postmortem').alias('pm').description('Post-incident reviews');

  cmd
    .command('list')
    .alias('ls')
    .description('List postmortems')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get(`/postmortems?limit=${opts.limit}`);
        const postmortems = Array.isArray(data) ? data : (data.postmortems || data.data || []);
        if (opts.json) { console.log(JSON.stringify(postmortems, null, 2)); return; }
        if (postmortems.length === 0) { console.log(chalk.gray('\n  No postmortems found.\n')); return; }
        console.log(createTable(
          ['ID', 'Title', 'Incident', 'Status', 'Created'],
          postmortems.map(p => [
            chalk.gray(String(p.id || '').slice(0, 8)),
            truncate(p.title || 'Untitled', 40),
            chalk.cyan(p.incidentId || p.incident_id || '-'),
            p.status === 'completed' ? chalk.green('Completed') : chalk.yellow(p.status || 'Draft'),
            timeAgo(p.createdAt || p.created_at),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('create <incidentId>')
    .description('Create a postmortem for an incident')
    .option('-t, --title <title>', 'Postmortem title')
    .action(async (incidentId, opts) => {
      try {
        const data = await api.post('/postmortems', { incidentId, title: opts.title || `Postmortem for ${incidentId}` });
        success(`Postmortem created: ${data.id || 'OK'}`);
      } catch (err) { handleError(err); }
    });
}
