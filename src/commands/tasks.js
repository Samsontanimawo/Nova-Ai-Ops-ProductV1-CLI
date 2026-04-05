/**
 * nova tasks — Sprinta kanban task management
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, truncate, timeAgo, handleError, success } from '../utils.js';

export function registerTaskCommands(program) {
  const cmd = program.command('tasks').alias('sprinta').description('Task & sprint management (Sprinta)');

  cmd
    .command('list')
    .alias('ls')
    .description('List tasks')
    .option('-s, --status <status>', 'Filter: todo, in-progress, done, blocked')
    .option('--assigned <user>', 'Filter by assignee')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const params = new URLSearchParams({ limit: opts.limit });
        if (opts.status) params.set('status', opts.status);
        if (opts.assigned) params.set('assigned', opts.assigned);
        const data = await api.get(`/tasks?${params}`);
        const tasks = Array.isArray(data) ? data : (data.tasks || data.data || []);
        if (opts.json) { console.log(JSON.stringify(tasks, null, 2)); return; }
        if (tasks.length === 0) { console.log(chalk.gray('\n  No tasks found.\n')); return; }
        const statusIcon = (s) => {
          const sl = (s || '').toLowerCase();
          if (sl === 'done' || sl === 'completed') return chalk.green('✓');
          if (sl === 'in-progress' || sl === 'in_progress') return chalk.blue('●');
          if (sl === 'blocked') return chalk.red('✕');
          return chalk.gray('○');
        };
        console.log(createTable(
          ['', 'Title', 'Priority', 'Assignee', 'Due'],
          tasks.map(t => [
            statusIcon(t.status),
            truncate(t.title || t.name || '-', 40),
            t.priority === 'high' ? chalk.red(t.priority) : t.priority === 'medium' ? chalk.yellow(t.priority) : chalk.gray(t.priority || '-'),
            chalk.cyan(t.assignee || t.assigned_to || '-'),
            t.dueDate || t.due_date ? timeAgo(t.dueDate || t.due_date) : chalk.gray('-'),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  cmd
    .command('create')
    .description('Create a task')
    .requiredOption('-t, --title <title>', 'Task title')
    .option('-p, --priority <priority>', 'Priority: low, medium, high', 'medium')
    .option('-a, --assign <user>', 'Assign to user')
    .option('-d, --due <date>', 'Due date (YYYY-MM-DD)')
    .action(async (opts) => {
      try {
        const data = await api.post('/tasks', {
          title: opts.title,
          priority: opts.priority,
          assignee: opts.assign,
          dueDate: opts.due,
        });
        success(`Task created: ${data.id || data.taskId || 'OK'}`);
      } catch (err) { handleError(err); }
    });

  cmd
    .command('done <id>')
    .description('Mark a task as done')
    .action(async (id) => {
      try {
        await api.put(`/tasks/${id}`, { status: 'done' });
        success(`Task ${id} marked as done`);
      } catch (err) { handleError(err); }
    });
}
