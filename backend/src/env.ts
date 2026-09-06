import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

let loaded = false;

function trimEnv(name: string): void {
  const value = process.env[name];
  if (typeof value === 'string') {
    process.env[name] = value.trim();
  }
}

export function loadEnv(): void {
  if (loaded) {
    return;
  }
  const candidates = [join(__dirname, '../.env'), join(process.cwd(), '.env')];
  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath });
      break;
    }
  }
  trimEnv('OPENAI_API_KEY');
  trimEnv('JWT_SECRET');
  loaded = true;
}
