import { createHibiClient, type HibiClient } from 'hibi-client';
import { getHibiApiKey } from './hibiApiKey';

export const HIBI_BASE_URL = 'https://hibi-api.vercel.app';

let cached: HibiClient | null = null;

export async function getHibiClient(): Promise<HibiClient | null> {
  if (cached) return cached;
  const apiKey = await getHibiApiKey();
  if (!apiKey) return null;
  cached = createHibiClient({ apiKey, baseUrl: HIBI_BASE_URL });
  return cached;
}

export function resetHibiClient(): void {
  cached = null;
}
