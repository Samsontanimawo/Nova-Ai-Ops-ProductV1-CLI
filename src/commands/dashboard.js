/**
 * nova dashboard — real-time metrics and golden signals
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { handleError } from '../utils.js';

export function registerDashboardCommands(program) {
  const cmd = program.command('dashboard').alias('dash').description('Real-time metrics dashboard');

  cmd
    .command('summary')
    .alias('s')
    .description('Show key platform metrics')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/golden-signals');
        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }
        console.log(chalk.bold('\n  Golden Signals\n'));
        const signals = data.signals || data;
        if (signals.latency !== undefined) console.log(`  ${chalk.gray('Latency P99:')}     ${chalk.cyan(signals.latency?.p99 || signals.latencyP99 || '-')}ms`);
        if (signals.traffic !== undefined || signals.rps !== undefined) console.log(`  ${chalk.gray('Traffic (RPS):')}    ${chalk.green(signals.traffic?.rps || signals.rps || '-')}`);
        if (signals.errors !== undefined) console.log(`  ${chalk.gray('Error Rate:')}      ${parseFloat(signals.errors?.rate || signals.errorRate || 0) > 1 ? chalk.red(signals.errors?.rate || signals.errorRate || '0') : chalk.green(signals.errors?.rate || signals.errorRate || '0')}%`);
        if (signals.saturation !== undefined) console.log(`  ${chalk.gray('CPU Saturation:')}  ${chalk.yellow(signals.saturation?.cpu || signals.cpuUsage || '-')}%`);
        if (signals.memory !== undefined) console.log(`  ${chalk.gray('Memory:')}          ${chalk.yellow(signals.memory?.used || signals.memUsage || '-')}%`);
        console.log('');
      } catch (err) { handleError(err); }
    });

  cmd
    .command('watch')
    .description('Live dashboard (refreshes every 5s)')
    .action(async () => {
      const refresh = async () => {
        try {
          const data = await api.get('/golden-signals');
          const s = data.signals || data;
          console.clear();
          console.log(chalk.cyan.bold('\n  NOVA AI OPS — Live Dashboard\n'));
          console.log(`  ${chalk.gray('Latency P99:')}     ${s.latency?.p99 || s.latencyP99 || '-'}ms`);
          console.log(`  ${chalk.gray('Traffic (RPS):')}    ${s.traffic?.rps || s.rps || '-'}`);
          console.log(`  ${chalk.gray('Error Rate:')}       ${s.errors?.rate || s.errorRate || '0'}%`);
          console.log(`  ${chalk.gray('CPU:')}              ${s.saturation?.cpu || s.cpuUsage || '-'}%`);
          console.log(`  ${chalk.gray('Memory:')}           ${s.memory?.used || s.memUsage || '-'}%`);
          console.log(chalk.gray(`\n  Last updated: ${new Date().toLocaleTimeString()}  (Ctrl+C to stop)\n`));
        } catch { console.log(chalk.red('\n  Failed to fetch metrics\n')); }
      };
      await refresh();
      setInterval(refresh, 5000);
    });
}
