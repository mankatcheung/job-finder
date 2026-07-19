import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.job-finder');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const DEFAULT_API_URL = 'http://localhost:3001/graphql';

interface Config {
  apiKey?: string;
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

export function getApiKey(): string | null {
  return readConfig().apiKey ?? null;
}

export function saveApiKey(apiKey: string): void {
  writeConfig({ ...readConfig(), apiKey });
}

export function clearApiKey(): void {
  if (!existsSync(CONFIG_FILE)) return;
  const { apiKey: _k, ...rest } = readConfig();
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
