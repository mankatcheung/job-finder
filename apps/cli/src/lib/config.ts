import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.job-finder');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const DEFAULT_API_URL = 'http://localhost:3001/graphql';

interface Config {
  token?: string;
  refreshToken?: string;
  expiresAt?: number;
  email?: string;
  apiUrl?: string;
}

function readConfig(): Config {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as Config;
  } catch {
    return {};
  }
}

function writeConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export interface AuthState {
  token: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
}

export function getAuth(): AuthState | null {
  const cfg = readConfig();
  if (!cfg.token || !cfg.refreshToken || !cfg.expiresAt || !cfg.email) return null;
  return { token: cfg.token, refreshToken: cfg.refreshToken, expiresAt: cfg.expiresAt, email: cfg.email };
}

export function saveAuth(auth: AuthState): void {
  const cfg = readConfig();
  writeConfig({ ...cfg, ...auth });
}

export function clearAuth(): void {
  if (!existsSync(CONFIG_FILE)) return;
  const cfg = readConfig();
  const { token: _t, refreshToken: _r, expiresAt: _e, email: _em, ...rest } = cfg;
  if (Object.keys(rest).length === 0) {
    rmSync(CONFIG_FILE);
  } else {
    writeConfig(rest);
  }
}

export function getApiUrl(): string {
  return readConfig().apiUrl ?? DEFAULT_API_URL;
}

export function saveApiUrl(url: string): void {
  writeConfig({ ...readConfig(), apiUrl: url });
}
