/**
 * nova search — Global search across incidents, services, runbooks, docs
 *
 * BACKEND: /api/search
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, truncate, timeAgo, handleError } from '../utils.js';

export function registerSearchCommand(program) {
  program
    .command('search <query>')
    .description('Search incidents, services, runbooks, and more')
    .option('-t, --type <type>', 'Filter by type (incident, service, runbook, page)')
    .option('-l, --limit <n>', 'Max results', '10')
    .option('--json', 'Output as JSON')
    .action(async (query, opts) => {
      try {
        const params = new URLSearchParams({ q: query, limit: opts.limit });
        if (opts.type) params.set('type', opts.type);
        const data = await api.get(`/search?${params}`);
        const results = data.results || data.data || [];

        if (opts.json) { console.log(JSON.stringify(results, null, 2)); return; }
        if (results.length === 0) { console.log(chalk.gray(`\n  No results for "${query}".\n`)); return; }

        // Strip <mark> tags for CLI display
        const clean = (s) => (s || '').replace(/<\/?mark>/g, '');

        console.log(createTable(
          ['Type', 'Title', 'Snippet', 'Updated'],
          results.map(r => [
            chalk.cyan(r.type || '-'),
            chalk.bold(truncate(clean(r.titleRaw || r.title || '-'), 40)),
            chalk.gray(truncate(clean(r.snippet || ''), 45)),
            timeAgo(r.updatedAt || r.createdAt),
          ])
        ));
        console.log(chalk.gray(`  ${data.total || results.length} result(s)\n`));
      } catch (err) { handleError(err); }
    });
}
