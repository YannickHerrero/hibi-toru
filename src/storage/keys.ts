export const STORAGE_KEYS = {
  entries: 'hibi-toru.entries.v1',
  savedWords: 'hibi-toru.savedWords.v1',
  settings: 'hibi-toru.settings.v1',
  onboarded: 'hibi-toru.onboarded.v1',
  recentRetimers: 'hibi-toru.recentRetimers.v1',
  wanikaniKanjiCache: 'hibi-toru.wanikaniKanjiCache.v1',
  lastSeenUpdateId: 'hibi-toru.lastSeenUpdateId.v1',
} as const;

export const SECURE_KEYS = {
  openrouterApiKey: 'hibi-toru.openrouterApiKey',
  wanikaniApiKey: 'hibi-toru.wanikaniApiKey',
  hibiApiKey: 'hibi-toru.hibiApiKey',
} as const;
