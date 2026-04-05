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
