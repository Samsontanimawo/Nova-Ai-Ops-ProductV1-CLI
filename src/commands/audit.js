/**
 * nova audit — page audit / site health
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, handleError, success } from '../utils.js';

export function registerAuditCommands(program) {
  const cmd = program.command('audit').description('Page health audit');

  cmd
    .command('run')
    .description('Trigger a page audit')
    .action(async () => {
      try {
        console.log(chalk.gray('\n  Running page audit...\n'));
        const data = await api.post('/site-audit/run', {});
        console.log(`  ${chalk.green('●')} Health Score: ${chalk.bold.green(Math.round((data.passed / data.totalPages) * 100) + '%')}`);
        console.log(`  ${chalk.gray('Pages:')} ${data.passed}/${data.totalPages} passed, ${data.failed} failed, ${data.warnings} warnings`);
        console.log(`  ${chalk.gray('Avg Response:')} ${Math.round(data.avgResponseMs)}ms`);
        console.log(`  ${chalk.gray('Duration:')} ${Math.round(data.durationMs / 1000)}s`);
        console.log('');
      } catch (err) { handleError(err); }
    });

  cmd
    .command('results')
    .description('Show latest audit results')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/site-audit/results');
        const results = data.results || [];
        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }
        if (results.length === 0) { console.log(chalk.gray('\n  No audit results. Run: nova audit run\n')); return; }
        console.log(createTable(
          ['Page', 'Status', 'HTTP', 'Response', 'Checks'],
          results.map(r => [
            r.page_name,
            r.status === 'pass' ? chalk.green('PASS') : r.status === 'warning' ? chalk.yellow('WARN') : chalk.red('FAIL'),
            r.status_code === 200 ? chalk.green('200') : chalk.red(String(r.status_code)),
            `${r.response_time_ms}ms`,
            `${r.checks_passed}/${r.checks_total}`,
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('ssl')
    .description('Check SSL certificate status')
    .action(async () => {
      try {
        const data = await api.get('/site-audit/ssl');
        const certs = data.certificates || [];
        if (certs.length === 0) { console.log(chalk.gray('\n  No SSL data. Run: nova audit run\n')); return; }
        for (const c of certs) {
          const color = (c.daysRemaining || 0) > 30 ? chalk.green : (c.daysRemaining || 0) > 7 ? chalk.yellow : chalk.red;
          console.log(`  ${color('●')} ${chalk.bold(c.domain)} — ${color(c.daysRemaining + ' days remaining')} (${c.issuer || 'unknown'})`);
        }
        console.log('');
      } catch (err) { handleError(err); }
    });
}
