/**
 * Nova CLI — Configuration management
 * Stores auth tokens, API URL, and user preferences in ~/.nova/config.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.nova');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const TOKEN_FILE = join(CONFIG_DIR, 'token');

const DEFAULT_CONFIG = {
  apiUrl: 'https://app.novaaiops.com/api',
  orgId: null,
  username: null,
  outputFormat: 'table', // table | json | yaml
};

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getConfig() {
  ensureDir();
  if (!existsSync(CONFIG_FILE)) return { ...DEFAULT_CONFIG };
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function setConfig(updates) {
  ensureDir();
  const current = getConfig();
  const merged = { ...current, ...updates };
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

export function getToken() {
  ensureDir();
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    return readFileSync(TOKEN_FILE, 'utf8').trim();
  } catch {
    return null;
  }
}

export function setToken(token) {
  ensureDir();
  writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
}

export function clearToken() {
  ensureDir();
  if (existsSync(TOKEN_FILE)) writeFileSync(TOKEN_FILE, '');
}

export function isAuthenticated() {
  return !!getToken();
}
