/**
 * nova escalation — escalation policies
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, handleError, success } from '../utils.js';

export function registerEscalationCommands(program) {
  const cmd = program.command('escalation').alias('esc').description('Escalation policies');

  cmd
    .command('list')
    .alias('ls')
    .description('List escalation policies')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/escalation-policies');
        const policies = Array.isArray(data) ? data : (data.policies || data.data || []);
        if (opts.json) { console.log(JSON.stringify(policies, null, 2)); return; }
        if (policies.length === 0) { console.log(chalk.gray('\n  No escalation policies configured.\n')); return; }
        console.log(createTable(
          ['Name', 'Levels', 'Timeout', 'Status'],
          policies.map(p => [
            chalk.bold(p.name || '-'),
            String(p.levels?.length || p.stepCount || '-'),
            `${p.timeout || p.escalateAfterMin || '-'}min`,
            p.enabled !== false ? chalk.green('Active') : chalk.gray('Disabled'),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('trigger <policyId>')
    .description('Manually trigger an escalation')
    .option('--incident <id>', 'Incident to escalate')
    .option('--reason <text>', 'Reason for escalation')
    .action(async (policyId, opts) => {
      try {
        await api.post(`/escalation-policies/${policyId}/trigger`, {
          incidentId: opts.incident,
          reason: opts.reason || 'Manual escalation via CLI',
        });
        success(`Escalation triggered: ${policyId}`);
      } catch (err) { handleError(err); }
    });
}
