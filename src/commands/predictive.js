/**
 * nova predict — predictive incident detection
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, severityColor, truncate, handleError } from '../utils.js';

export function registerPredictiveCommands(program) {
  program
    .command('predict')
    .description('Show predictive incident detection results')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get('/predictive/anomalies');
        const predictions = Array.isArray(data) ? data : (data.data || data.predictions || data.anomalies || []);
        if (opts.json) { console.log(JSON.stringify(predictions, null, 2)); return; }
        if (predictions.length === 0) { console.log(chalk.green('\n  No predicted incidents. Systems look stable.\n')); return; }
        console.log(createTable(
          ['Service', 'Metric', 'Severity', 'Value', 'Expected', 'Detected'],
          predictions.map(p => [
            chalk.bold(truncate(p.service_name || p.service || p.name || '-', 30)),
            chalk.gray(truncate(p.metric_name || p.metric || '-', 28)),
            severityColor(p.severity)(p.severity || '-'),
            chalk.yellow(String(p.detected_value != null ? Number(p.detected_value).toFixed(1) : '-')),
            chalk.gray(String(p.expected_value != null ? Number(p.expected_value).toFixed(1) : '-')),
            chalk.gray(p.detected_at || '-'),
          ])
        ));
      } catch (err) { handleError(err); }
    });
}
