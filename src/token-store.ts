import fs from 'fs';
import os from 'os';
import path from 'path';

export interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  /** Epoch milliseconds when the access token expires. */
  expires_at: number;
}

const dir = process.env.WHOOP_TOKEN_DIR || path.join(os.homedir(), '.config', 'whoop-mcp');
const file = path.join(dir, 'tokens.json');

export function loadTokens(): StoredTokens | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as StoredTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: StoredTokens): void {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, JSON.stringify(tokens), { mode: 0o600 });
  fs.chmodSync(file, 0o600);
}

export function tokenFilePath(): string {
  return file;
}
