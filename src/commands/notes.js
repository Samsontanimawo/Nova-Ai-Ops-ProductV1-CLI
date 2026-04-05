/**
 * nova notes — Engineering notebook
 *
 * BACKEND: /api/notes
 */

import chalk from 'chalk';
import { api } from '../api.js';
import { createTable, truncate, timeAgo, handleError, success } from '../utils.js';

export function registerNoteCommands(program) {
  const cmd = program.command('notes').alias('note').description('Engineering notebook');

  // ── list ───────────────────────────────────────────────────────────────
  cmd
    .command('list')
    .alias('ls')
    .description('List notes')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const data = await api.get(`/notes?limit=${opts.limit}`);
        const notes = Array.isArray(data) ? data : (data.notes || data.data || []);
        if (opts.json) { console.log(JSON.stringify(notes, null, 2)); return; }
        if (notes.length === 0) { console.log(chalk.gray('\n  No notes found.\n')); return; }
        console.log(createTable(
          ['ID', 'Title', 'Tags', 'Updated'],
          notes.map(n => [
            chalk.gray(String(n.id || '').slice(0, 8)),
            chalk.bold(truncate(n.title || 'Untitled', 40)),
            chalk.cyan(Array.isArray(n.tags) ? n.tags.join(', ') : (n.tags || '-')),
            timeAgo(n.updatedAt || n.updated_at || n.createdAt),
          ])
        ));
      } catch (err) { handleError(err); }
    });

  // ── create ─────────────────────────────────────────────────────────────
  cmd
    .command('create')
    .description('Create a note')
    .requiredOption('-t, --title <title>', 'Note title')
    .option('-b, --body <text>', 'Note body')
    .option('--tags <tags>', 'Comma-separated tags')
    .action(async (opts) => {
      try {
        const data = await api.post('/notes', {
          title: opts.title,
          content: opts.body || '',
          tags: opts.tags ? opts.tags.split(',').map(t => t.trim()) : [],
        });
        success(`Note created: ${data.id || data.note?.id || 'OK'}`);
      } catch (err) { handleError(err); }
    });

  // ── view ───────────────────────────────────────────────────────────────
  cmd
    .command('view <id>')
    .description('View a note')
    .action(async (id) => {
      try {
        const data = await api.get(`/notes/${id}`);
        const note = data.note || data;
        console.log('');
        console.log(`  ${chalk.bold(note.title || 'Untitled')}`);
        if (note.tags?.length) console.log(`  ${chalk.cyan(note.tags.join(', '))}`);
        console.log(`  ${chalk.gray(timeAgo(note.updatedAt || note.createdAt))}`);
        console.log('');
        console.log(note.content || note.body || chalk.gray('  (empty)'));
        console.log('');
      } catch (err) { handleError(err); }
    });
}
