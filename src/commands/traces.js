/**
 * nova traces — distributed tracing
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, truncate, statusColor, handleError } from '../utils.js';

export function registerTraceCommands(program) {
  const cmd = program.command('traces').alias('trace').description('Distributed request tracing');

  cmd
    .command('list')
    .alias('ls')
    .description('List recent traces')
    .option('--service <name>', 'Filter by service')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--min-duration <ms>', 'Minimum duration in ms')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const params = new URLSearchParams({ limit: opts.limit });
        if (opts.service) params.set('service', opts.service);
        if (opts.minDuration) params.set('minDuration', opts.minDuration);
        const data = await api.get(`/traces?${params}`);
        const traces = Array.isArray(data) ? data : (data.traces || data.data || []);
        if (opts.json) { console.log(JSON.stringify(traces, null, 2)); return; }
        if (traces.length === 0) { console.log(chalk.gray('\n  No traces found.\n')); return; }
        console.log(createTable(
          ['Trace ID', 'Service', 'Duration', 'Spans', 'Status'],
          traces.map(t => [
            chalk.gray(truncate(t.traceId || t.trace_id || '', 12)),
            chalk.cyan(t.service || t.rootService || '-'),
            `${t.duration || 0}ms`,
            String(t.spanCount || t.spans?.length || '-'),
            statusColor(t.status)(t.status || '-'),
          ])
        ));
      } catch (err) { handleError(err); }
    });
}
