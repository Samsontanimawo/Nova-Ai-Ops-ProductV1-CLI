/**
 * nova gauge — System resource monitoring (CPU, memory, disk, Docker)
 *
 * BACKEND: /api/system-gauge
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, handleError } from '../utils.js';

function bar(percent, width = 20) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const color = percent > 90 ? chalk.red : percent > 70 ? chalk.yellow : chalk.green;
  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty)) + ` ${percent}%`;
}

export function registerGaugeCommands(program) {
  const cmd = program.command('gauge').alias('system-gauge').description('System resource monitoring');

  // ── overview — full system overview ────────────────────────────────────
  cmd
    .command('overview')
    .alias('ov')
    .description('System resource overview')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/system-gauge/overview');
        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }

        const mem = data.memory || {};
        const cpu = data.cpu || {};
        const disk = data.disk || {};
        const load = data.load || {};

        console.log('');
        console.log(`  ${chalk.bold('System Gauge')} — ${chalk.gray(data.hostname || '-')}`);
        console.log(`  ${chalk.gray(`${data.platform || '-'} ${data.arch || '-'} | Node ${data.nodeVersion || '-'}`)}`);
        console.log('');
        console.log(`  ${chalk.gray('CPU:')}     ${bar(cpu.overall || 0)}`);
        console.log(`  ${chalk.gray('Memory:')}  ${bar(mem.percent || 0)}  ${chalk.gray(`${mem.usedFormatted || '-'} / ${mem.totalFormatted || '-'}`)}`);
        if (disk.percent != null) console.log(`  ${chalk.gray('Disk:')}    ${bar(disk.percent || 0)}  ${chalk.gray(`${disk.usedFormatted || '-'} / ${disk.totalFormatted || '-'}`)}`);
        if (load.avg1m != null) console.log(`  ${chalk.gray('Load:')}    ${chalk.bold(String(load.avg1m || 0))} ${chalk.gray(`/ ${load.avg5m || 0} / ${load.avg15m || 0}`)}`);
        console.log('');
      } catch (err) { handleError(err); }
    });

  // ── health — health score ──────────────────────────────────────────────
  cmd
    .command('health')
    .description('System health score')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/system-gauge/health-score');
        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }

        const score = data.score || 0;
        const color = score >= 80 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;

        console.log('');
        console.log(`  ${chalk.bold('Health Score:')} ${color.bold(score + '/100')} ${chalk.gray(`(${data.trend || '-'})`)}`);
        console.log('');
        const subs = data.subscores || {};
        for (const [key, val] of Object.entries(subs)) {
          console.log(`  ${chalk.gray(key.padEnd(8))} ${bar(val)}`);
        }
        if (data.factors?.length) {
          console.log('');
          console.log(`  ${chalk.yellow.bold('Issues:')}`);
          for (const f of data.factors) {
            console.log(`  ${chalk.yellow('●')} ${f}`);
          }
        }
        console.log('');
      } catch (err) { handleError(err); }
    });

  // ── docker — Docker resource usage ─────────────────────────────────────
  cmd
    .command('docker')
    .description('Docker resource usage')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/system-gauge/docker');
        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const containers = data.containers || data.data || [];
        if (!Array.isArray(containers) || containers.length === 0) {
          console.log(chalk.gray('\n  No Docker data available.\n'));
          return;
        }
        console.log(createTable(
          ['Container', 'CPU %', 'Memory', 'Mem %', 'Net I/O', 'Disk I/O'],
          containers.map(c => [
            chalk.bold(c.name || '-'),
            c.cpuPercent != null ? chalk.cyan(String(c.cpuPercent) + '%') : '-',
            chalk.gray(c.memUsage || '-'),
            c.memPercent != null ? String(c.memPercent) + '%' : '-',
            chalk.gray(c.netIO || '-'),
            chalk.gray(c.blockIO || '-'),
          ])
        ));
      } catch (err) { handleError(err); }
    });
}
