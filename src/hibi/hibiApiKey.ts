import * as SecureStore from 'expo-secure-store';
import { SECURE_KEYS } from '@/storage/keys';
import { resetHibiClient } from './hibiClient';

export async function getHibiApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SECURE_KEYS.hibiApiKey);
  } catch (err) {
    console.warn('[hibi] getHibiApiKey failed', err);
    return null;
  }
}

export async function setHibiApiKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) {
    await SecureStore.deleteItemAsync(SECURE_KEYS.hibiApiKey);
  } else {
    await SecureStore.setItemAsync(SECURE_KEYS.hibiApiKey, trimmed);
  }
  resetHibiClient();
}

export async function clearHibiApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_KEYS.hibiApiKey);
  resetHibiClient();
}

export async function hasHibiApiKey(): Promise<boolean> {
  return (await getHibiApiKey()) !== null;
}
