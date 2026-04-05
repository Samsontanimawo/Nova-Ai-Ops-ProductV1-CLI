/**
 * nova status — quick platform health overview
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { statusColor, handleError } from '../utils.js';

export function registerStatusCommand(program) {
  program
    .command('status')
    .description('Show platform health overview')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        // Fetch services, incidents, and health in parallel
        const [servicesData, incidentsData] = await Promise.all([
          api.get('/services').catch(() => []),
          api.get('/incidents').catch(() => []),
        ]);

        const services = Array.isArray(servicesData) ? servicesData : (servicesData?.services || servicesData?.data || []);
        const incidents = Array.isArray(incidentsData) ? incidentsData : (incidentsData?.incidents || incidentsData?.data || []);

        const healthy = services.filter(s => s.status === 'healthy').length;
        const degraded = services.filter(s => s.status === 'degraded').length;
        const critical = services.filter(s => s.status === 'critical').length;
        const openIncidents = incidents.filter(i => i.status !== 'resolved').length;

        if (opts.json) {
          console.log(JSON.stringify({ services: { total: services.length, healthy, degraded, critical }, incidents: { open: openIncidents, total: incidents.length } }, null, 2));
          return;
        }

        const overall = critical > 0 ? 'CRITICAL' : degraded > 0 ? 'DEGRADED' : 'HEALTHY';
        const overallColor = critical > 0 ? chalk.red.bold : degraded > 0 ? chalk.yellow.bold : chalk.green.bold;

        console.log('');
        console.log(`  ${overallColor('●')} ${overallColor(`System Status: ${overall}`)}`);
        console.log('');
        console.log(`  ${chalk.gray('Services')}     ${chalk.green(healthy)} healthy  ${degraded > 0 ? chalk.yellow(degraded + ' degraded') : ''}  ${critical > 0 ? chalk.red(critical + ' critical') : ''}`);
        console.log(`  ${chalk.gray('Incidents')}    ${openIncidents > 0 ? chalk.red(openIncidents + ' open') : chalk.green('0 open')}  ${chalk.gray(incidents.length + ' total')}`);
        console.log(`  ${chalk.gray('Total')}        ${services.length} services monitored`);
        console.log('');

        // Show critical services
        if (critical > 0) {
          console.log(chalk.red.bold('  Critical Services:'));
          services.filter(s => s.status === 'critical').forEach(s => {
            console.log(`    ${chalk.red('●')} ${s.name} — ${chalk.gray(s.type || '')} ${chalk.gray(s.region || '')}`);
          });
          console.log('');
        }
      } catch (err) {
        handleError(err);
      }
    });
}
