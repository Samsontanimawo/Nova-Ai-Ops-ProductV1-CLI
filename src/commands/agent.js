/**
 * nova agent — status, install, logs
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, statusColor, timeAgo, handleError } from '../utils.js';

export function registerAgentCommands(program) {
  const cmd = program.command('agent').description('Manage Nova agents');

  cmd
    .command('status')
    .description('Show agent status')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/agents');
        const agents = Array.isArray(data) ? data : (data.agents || data.data || []);

        if (opts.json) {
          console.log(JSON.stringify(agents, null, 2));
          return;
        }

        if (agents.length === 0) {
          console.log(chalk.yellow('\n  No agents registered.\n'));
          return;
        }

        console.log(createTable(
          ['Agent ID', 'Hostname', 'Status', 'Platform', 'Last Heartbeat'],
          agents.map(a => [
            chalk.cyan(a.agentId || a.agent_id || '-'),
            a.hostname || '-',
            statusColor(a.status || 'unknown')(a.status || 'unknown'),
            chalk.gray(`${a.platform || '-'} ${a.arch || ''}`),
            timeAgo(a.lastHeartbeat || a.last_heartbeat || a.lastSeen),
          ])
        ));
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('install')
    .description('Show agent install instructions')
    .action(() => {
      console.log('');
      console.log(chalk.bold('  Install Nova Agent'));
      console.log(chalk.gray('  ─────────────────'));
      console.log('');
      console.log('  1. SSH into your server');
      console.log('');
      console.log(chalk.cyan('  curl -sSL https://get.novaaiops.com/agent | bash'));
      console.log('');
      console.log('  2. Configure the agent:');
      console.log('');
      console.log(chalk.gray('  Edit /opt/nova-agent/.env:'));
      console.log(chalk.cyan('    NOVA_BACKEND_URL=https://app.novaaiops.com'));
      console.log(chalk.cyan('    NOVA_AGENT_ID=your-agent-name'));
      console.log(chalk.cyan('    NOVA_AGENT_SECRET=your-secret'));
      console.log('');
      console.log('  3. Start the agent:');
      console.log('');
      console.log(chalk.cyan('  sudo systemctl start nova-agent'));
      console.log(chalk.cyan('  sudo systemctl enable nova-agent'));
      console.log('');
    });
}
