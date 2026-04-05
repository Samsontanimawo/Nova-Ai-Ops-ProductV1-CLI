/**
 * nova notifications — notification center
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, timeAgo, truncate, handleError, success } from '../utils.js';

export function registerNotificationCommands(program) {
  const cmd = program.command('notifications').alias('notif').description('Notification center');

  cmd
    .command('list')
    .alias('ls')
    .description('List recent notifications')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--unread', 'Show only unread')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const params = new URLSearchParams({ limit: opts.limit });
        if (opts.unread) params.set('unread', 'true');
        const data = await api.get(`/notifications?${params}`);
        const notifications = Array.isArray(data) ? data : (data.notifications || data.data || []);
        if (opts.json) { console.log(JSON.stringify(notifications, null, 2)); return; }
        if (notifications.length === 0) { console.log(chalk.gray('\n  No notifications.\n')); return; }
        for (const n of notifications) {
          const icon = n.read ? chalk.gray('○') : chalk.blue('●');
          const title = n.read ? chalk.gray(n.title || n.message || '') : chalk.white(n.title || n.message || '');
          console.log(`  ${icon} ${title}  ${chalk.gray(timeAgo(n.createdAt || n.created_at || n.timestamp))}`);
        }
        console.log('');
      } catch (err) { handleError(err); }
    });

  cmd
    .command('read-all')
    .description('Mark all notifications as read')
    .action(async () => {
      try {
        await api.post('/notifications/read-all', {});
        success('All notifications marked as read');
      } catch (err) { handleError(err); }
    });

  cmd
    .command('count')
    .description('Show unread notification count')
    .action(async () => {
      try {
        const data = await api.get('/notifications/unread-count');
        const count = data.count ?? data.unread ?? 0;
        console.log(`\n  ${count > 0 ? chalk.blue.bold(count) : chalk.green('0')} unread notification(s)\n`);
      } catch (err) { handleError(err); }
    });
}
