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
        const data = await api.get('/predictive');
        const predictions = Array.isArray(data) ? data : (data.predictions || data.anomalies || data.data || []);
        if (opts.json) { console.log(JSON.stringify(predictions, null, 2)); return; }
        if (predictions.length === 0) { console.log(chalk.green('\n  No predicted incidents. Systems look stable.\n')); return; }
        console.log(createTable(
          ['Service', 'Risk', 'Confidence', 'Signal', 'Predicted In'],
          predictions.map(p => [
            chalk.bold(p.service || p.name || '-'),
            severityColor(p.risk || p.severity)(p.risk || p.severity || '-'),
            `${Math.round((p.confidence || 0) * 100)}%`,
            truncate(p.signal || p.metric || p.description || '-', 30),
            p.predictedIn || p.eta || '-',
          ])
        ));
      } catch (err) { handleError(err); }
    });
}
