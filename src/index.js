/**
 * Nova CLI — Main entry point
 *
 * Command-line interface for Nova AI Ops SRE platform.
 * Manage incidents, services, alerts, runbooks, agents, and more from the terminal.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { registerAuthCommands } from './commands/auth.js';
import { registerIncidentCommands } from './commands/incidents.js';
import { registerServiceCommands } from './commands/services.js';
import { registerAlertCommands } from './commands/alerts.js';
import { registerAgentCommands } from './commands/agent.js';
import { registerRunbookCommands } from './commands/runbooks.js';
import { registerSLOCommands } from './commands/slo.js';
import { registerStatusCommand } from './commands/status.js';
import { registerMetricsCommands } from './commands/metrics.js';
import { registerLogCommands } from './commands/logs.js';
import { registerTraceCommands } from './commands/traces.js';
import { registerOnCallCommands } from './commands/oncall.js';
import { registerTeamCommands } from './commands/teams.js';
import { registerBackupCommands } from './commands/backups.js';
import { registerAuditCommands } from './commands/audit.js';
import { registerCertCommands } from './commands/certs.js';
import { registerSyntheticCommands } from './commands/synthetic.js';
import { registerPostmortemCommands } from './commands/postmortem.js';
import { registerIntegrationCommands } from './commands/integrations.js';
import { registerTenantCommands } from './commands/tenants.js';
import { registerPredictiveCommands } from './commands/predictive.js';
import { registerDashboardCommands } from './commands/dashboard.js';
import { registerNotificationCommands } from './commands/notifications.js';
import { registerEscalationCommands } from './commands/escalation.js';
import { registerDockerCommands } from './commands/docker.js';
import { registerTaskCommands } from './commands/tasks.js';
import { registerWebhookCommands } from './commands/webhooks.js';
import { registerTransferCommands } from './commands/transfer.js';
import { registerApiKeyCommands } from './commands/apikeys.js';
import { registerChangeFreezeCommands } from './commands/changefreezes.js';
import { getConfig } from './config.js';

const program = new Command();

// Banner
const banner = chalk.cyan(`
  ╔══════════════════════════════════════════════╗
  ║  ${chalk.bold.white('NOVA CLI')}  ${chalk.gray('— Nova AI Ops Platform')}          ║
  ║  ${chalk.gray('Incidents · Services · Alerts · Runbooks')}   ║
  ╚══════════════════════════════════════════════╝
`);

program
  .name('nova')
  .description('Nova AI Ops — SRE command-line interface')
  .version('1.0.0')
  .addHelpText('beforeAll', banner)
  .configureHelp({
    sortSubcommands: true,
    subcommandTerm: (cmd) => cmd.name(),
  });

// Register all command groups
registerAuthCommands(program);    // login, logout, whoami
registerStatusCommand(program);   // status
registerIncidentCommands(program); // incidents list/create/resolve/ack
registerServiceCommands(program);  // services list/health
registerAlertCommands(program);    // alerts list
registerAgentCommands(program);    // agent status/install
registerRunbookCommands(program);  // runbooks list/run
registerSLOCommands(program);      // slo check
registerMetricsCommands(program);  // metrics query/push
registerLogCommands(program);      // logs search/tail
registerTraceCommands(program);    // traces list
registerOnCallCommands(program);   // oncall who/list
registerTeamCommands(program);     // teams list/invite
registerBackupCommands(program);   // backups list/create/restore
registerAuditCommands(program);    // audit run/results/ssl
registerCertCommands(program);     // certs (SSL status)
registerSyntheticCommands(program); // synthetic list/run
registerPostmortemCommands(program); // postmortem list/create
registerIntegrationCommands(program); // integrations status
registerTenantCommands(program);   // tenants list/create
registerPredictiveCommands(program); // predict (ML anomaly detection)
registerDashboardCommands(program);  // dashboard summary/watch
registerNotificationCommands(program); // notifications list/read-all/count
registerEscalationCommands(program); // escalation list/trigger
registerDockerCommands(program);    // docker ps/stats
registerTaskCommands(program);      // tasks list/create/done (Sprinta)
registerWebhookCommands(program);   // webhooks list/test/create
registerTransferCommands(program);  // transfer list/buckets/estimate
registerApiKeyCommands(program);    // apikeys list/create/revoke
registerChangeFreezeCommands(program); // freeze list/create/check

// Config command
program
  .command('config')
  .description('Show current CLI configuration')
  .action(() => {
    const config = getConfig();
    console.log('');
    console.log(`  ${chalk.gray('API URL:')}   ${config.apiUrl}`);
    console.log(`  ${chalk.gray('Username:')}  ${config.username || chalk.yellow('Not logged in')}`);
    console.log(`  ${chalk.gray('Org ID:')}    ${config.orgId || chalk.gray('N/A')}`);
    console.log(`  ${chalk.gray('Format:')}    ${config.outputFormat}`);
    console.log('');
  });

// Open web UI
program
  .command('open')
  .description('Open Nova AI Ops in the browser')
  .action(() => {
    const url = getConfig().apiUrl.replace('/api', '');
    console.log(chalk.cyan(`\n  Opening ${url}\n`));
    import('child_process').then(cp => {
      const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      cp.exec(`${cmd} ${url}`);
    });
  });

// Parse and execute
program.parse();
