/**
 * nova transfer — file transfer and storage (Nova Transfer)
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, timeAgo, handleError, success } from '../utils.js';

export function registerTransferCommands(program) {
  const cmd = program.command('transfer').description('File transfer & storage (Nova Transfer)');

  cmd
    .command('list')
    .alias('ls')
    .description('List files in storage')
    .option('--bucket <name>', 'Bucket/folder name')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const params = opts.bucket ? `?bucket=${opts.bucket}` : '';
        const data = await api.get(`/storage-nexus/files${params}`);
        const files = Array.isArray(data) ? data : (data.files || data.objects || data.data || []);
        if (opts.json) { console.log(JSON.stringify(files, null, 2)); return; }
        if (files.length === 0) { console.log(chalk.gray('\n  No files found.\n')); return; }
        console.log(createTable(
          ['Name', 'Size', 'Type', 'Modified'],
          files.map(f => [
            chalk.bold(f.name || f.key || '-'),
            f.size || f.fileSize || '-',
            chalk.gray(f.contentType || f.type || '-'),
            timeAgo(f.lastModified || f.modified || f.updatedAt),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('buckets')
    .description('List storage buckets')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/storage-nexus/buckets');
        const buckets = Array.isArray(data) ? data : (data.buckets || data.data || []);
        if (opts.json) { console.log(JSON.stringify(buckets, null, 2)); return; }
        if (buckets.length === 0) { console.log(chalk.gray('\n  No buckets found.\n')); return; }
        console.log(createTable(
          ['Bucket', 'Region', 'Files', 'Size', 'Created'],
          buckets.map(b => [
            chalk.bold(b.name || '-'),
            chalk.gray(b.region || '-'),
            String(b.objectCount || b.fileCount || '-'),
            b.totalSize || '-',
            timeAgo(b.createdAt || b.created_at),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('estimate')
    .description('Estimate transfer cost')
    .requiredOption('-s, --size <gb>', 'Data size in GB')
    .option('--from <region>', 'Source region', 'us-east-1')
    .option('--to <region>', 'Destination region', 'us-west-2')
    .option('--provider <name>', 'Cloud provider (aws, azure, gcp)', 'aws')
    .action(async (opts) => {
      try {
        const data = await api.post('/costs/estimate', {
          sizeGB: parseFloat(opts.size),
          sourceRegion: opts.from,
          destRegion: opts.to,
          provider: opts.provider,
        });
        console.log(`\n  ${chalk.bold('Transfer Cost Estimate')}`);
        console.log(`  ${chalk.gray('Size:')}       ${opts.size} GB`);
        console.log(`  ${chalk.gray('Route:')}      ${opts.from} → ${opts.to}`);
        console.log(`  ${chalk.gray('Provider:')}   ${opts.provider}`);
        console.log(`  ${chalk.gray('Estimated:')} ${chalk.green.bold('$' + (data.estimatedCost || data.cost || 0).toFixed(4))}`);
        console.log('');
      } catch (err) { handleError(err); }
    });
}
