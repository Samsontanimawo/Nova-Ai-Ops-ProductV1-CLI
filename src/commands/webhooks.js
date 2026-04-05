/**
 * nova webhooks — webhook gateway management
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, statusColor, timeAgo, truncate, handleError, success } from '../utils.js';

export function registerWebhookCommands(program) {
  const cmd = program.command('webhooks').alias('wh').description('Webhook gateway');

  cmd
    .command('list')
    .alias('ls')
    .description('List webhook subscriptions')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/webhooks');
        const webhooks = Array.isArray(data) ? data : (data.webhooks || data.subscriptions || data.data || []);
        if (opts.json) { console.log(JSON.stringify(webhooks, null, 2)); return; }
        if (webhooks.length === 0) { console.log(chalk.gray('\n  No webhooks configured.\n')); return; }
        console.log(createTable(
          ['Name', 'URL', 'Events', 'Status', 'Last Delivery'],
          webhooks.map(w => [
            chalk.bold(truncate(w.name || w.description || '-', 25)),
            chalk.gray(truncate(w.url || w.endpoint || '-', 35)),
            chalk.cyan(Array.isArray(w.events) ? w.events.join(', ') : (w.events || '-')),
            statusColor(w.status || 'active')(w.status || 'active'),
            timeAgo(w.lastDelivery || w.last_delivery),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('test <id>')
    .description('Send a test webhook payload')
    .action(async (id) => {
      try {
        await api.post(`/webhooks/${id}/test`, {});
        success(`Test webhook sent to ${id}`);
      } catch (err) { handleError(err); }
    });

  cmd
    .command('create')
    .description('Create a webhook subscription')
    .requiredOption('-u, --url <url>', 'Webhook endpoint URL')
    .option('-n, --name <name>', 'Webhook name')
    .option('-e, --events <events>', 'Comma-separated events (incident.created, alert.fired)', 'incident.created')
    .action(async (opts) => {
      try {
        const data = await api.post('/webhooks', {
          url: opts.url,
          name: opts.name || opts.url,
          events: opts.events.split(',').map(e => e.trim()),
        });
        success(`Webhook created: ${data.id || 'OK'}`);
      } catch (err) { handleError(err); }
    });
}
