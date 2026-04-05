/**
 * nova tenants — tenant/organization management (admin)
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, handleError, success } from '../utils.js';

export function registerTenantCommands(program) {
  const cmd = program.command('tenants').alias('orgs').description('Tenant/organization management (admin)');

  cmd
    .command('list')
    .alias('ls')
    .description('List all organizations')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/v1/organizations');
        const orgs = Array.isArray(data) ? data : (data.organizations || data.data || []);
        if (opts.json) { console.log(JSON.stringify(orgs, null, 2)); return; }
        if (orgs.length === 0) { console.log(chalk.gray('\n  No organizations found.\n')); return; }
        console.log(createTable(
          ['Org ID', 'Name', 'Plan', 'Members', 'Status'],
          orgs.map(o => [
            chalk.cyan(o.orgId || o.org_id || o.id || '-'),
            chalk.bold(o.name || o.orgName || '-'),
            chalk.gray(o.plan || o.tier || 'Free'),
            String(o.memberCount || o.members || '-'),
            o.status === 'active' ? chalk.green('Active') : chalk.red(o.status || '-'),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('create')
    .description('Create a new organization')
    .requiredOption('-n, --name <name>', 'Organization name')
    .option('--plan <plan>', 'Plan tier', 'free')
    .action(async (opts) => {
      try {
        const data = await api.post('/v1/organizations', { name: opts.name, plan: opts.plan });
        success(`Organization created: ${data.orgId || data.id || opts.name}`);
      } catch (err) { handleError(err); }
    });
}
