/**
 * Nova CLI — Shared utilities
 */

import chalk from 'chalk';
import Table from 'cli-table3';

// Status colors
export const statusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'healthy' || s === 'resolved' || s === 'pass' || s === 'running' || s === 'active') return chalk.green;
  if (s === 'warning' || s === 'degraded' || s === 'investigating') return chalk.yellow;
  if (s === 'critical' || s === 'failed' || s === 'fail' || s === 'error' || s === 'down') return chalk.red;
  return chalk.gray;
};

// Severity colors
export const severityColor = (severity) => {
  const s = (severity || '').toLowerCase();
  if (s === 'critical' || s === 'p1') return chalk.red.bold;
  if (s === 'high' || s === 'p2') return chalk.red;
  if (s === 'medium' || s === 'warning' || s === 'p3') return chalk.yellow;
  if (s === 'low' || s === 'p4') return chalk.blue;
  return chalk.gray;
};

// Time formatting
export const timeAgo = (dateStr) => {
  if (!dateStr) return 'N/A';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// Create a formatted table
export const createTable = (headers, rows) => {
  const table = new Table({
    head: headers.map(h => chalk.gray.bold(h)),
    style: { head: [], border: ['gray'] },
    chars: {
      top: '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      bottom: '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      left: '│', 'left-mid': '├', mid: '─', 'mid-mid': '┼',
      right: '│', 'right-mid': '┤', middle: '│',
    },
  });
  rows.forEach(row => table.push(row));
  return table.toString();
};

// Error handler
export const handleError = (err) => {
  console.error(chalk.red(`\n  Error: ${err.message || err}\n`));
  process.exit(1);
};

// Success message
export const success = (msg) => console.log(chalk.green(`\n  ✓ ${msg}\n`));

// Info message
export const info = (msg) => console.log(chalk.blue(`  ℹ ${msg}`));

// Truncate string
export const truncate = (str, len = 50) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
};
