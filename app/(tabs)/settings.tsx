import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { AppSettings, SubtitleMode } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import {
  getSettings,
  saveSettings,
  getOpenRouterApiKey,
  setOpenRouterApiKey,
  clearOpenRouterApiKey,
  getWanikaniApiKey,
  setWanikaniApiKey,
  clearWanikaniApiKey,
} from '@/storage/settings';
import { testOpenRouterApiKey } from '@/openrouter/client';
import { getHibiApiKey, setHibiApiKey, clearHibiApiKey } from '@/hibi/hibiApiKey';
import { getHibiClient } from '@/hibi/hibiClient';
import { syncAllPending } from '@/hibi/sync';
import { listPendingMinedCards } from '@/db/minedCards';
import { useThemeSwitcher } from '@/theme';
import { fetchAllWanikaniKanji, testWanikaniApiKey } from '@/wanikani/api';
import {
  clearKanjiCache,
  getKanjiCacheStats,
  saveKanjiCache,
  type KanjiCacheStats,
} from '@/wanikani/cache';

const SUB_MODES: SubtitleMode[] = ['jp', 'jp+en', 'en'];

const MODE_LABELS: Record<SubtitleMode, string> = {
  jp: 'JP only',
  'jp+en': 'JP + EN',
  en: 'EN only',
};

export default function SettingsScreen() {
  const { theme, setTheme, available } = useThemeSwitcher();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [keyDirty, setKeyDirty] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [wkKey, setWkKey] = useState<string>('');
  const [wkSyncing, setWkSyncing] = useState(false);
  const [wkProgress, setWkProgress] = useState<{ done: number; total: number } | null>(null);
  const [wkResult, setWkResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [wkStats, setWkStats] = useState<KanjiCacheStats | null>(null);
  const [hibiKey, setHibiKey] = useState<string>('');
  const [hibiKeyDirty, setHibiKeyDirty] = useState(false);
  const [hibiTesting, setHibiTesting] = useState(false);
  const [hibiResult, setHibiResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      const [s, k, w, ws, hk] = await Promise.all([
        getSettings(),
        getOpenRouterApiKey(),
        getWanikaniApiKey(),
        getKanjiCacheStats(),
        getHibiApiKey(),
      ]);
      setSettings(s);
      setApiKeyState(k ?? '');
      setWkKey(w ?? '');
      setWkStats(ws);
      setHibiKey(hk ?? '');
      try {
        const pending = await listPendingMinedCards();
        setPendingCount(pending.length);
      } catch {
        setPendingCount(0);
      }
      setLoaded(true);
    })();
  }, []);

  const onSaveKey = async () => {
    const trimmed = apiKey.trim();
    if (trimmed.length === 0) {
      await clearOpenRouterApiKey();
    } else {
      await setOpenRouterApiKey(trimmed);
    }
    setKeyDirty(false);
    setTestResult(null);
  };

  const onTest = async () => {
    if (!loaded || apiKey.trim().length === 0) return;
    setTesting(true);
    setTestResult(null);
    try {
      const trimmed = apiKey.trim();
      if (keyDirty) await setOpenRouterApiKey(trimmed);
      const info = await testOpenRouterApiKey(trimmed);
      setKeyDirty(false);
      setTestResult({
        ok: true,
        message: `Connected as "${info.label}" — used $${info.usage.toFixed(2)}` +
          (info.limit != null ? ` of $${info.limit.toFixed(2)}` : ''),
      });
    } catch (e) {
      setTestResult({ ok: false, message: (e as Error).message });
    } finally {
      setTesting(false);
    }
  };

  const onSyncWanikani = async () => {
    const trimmed = wkKey.trim();
    if (trimmed.length === 0) {
      await clearWanikaniApiKey();
      await clearKanjiCache();
      setWkStats(null);
      setWkResult({ ok: true, message: 'WaniKani disconnected.' });
      return;
    }
    setWkSyncing(true);
    setWkResult(null);
    setWkProgress(null);
    try {
      const user = await testWanikaniApiKey(trimmed);
      await setWanikaniApiKey(trimmed);
      const byChar = await fetchAllWanikaniKanji(trimmed, (done, total) => {
        setWkProgress({ done, total });
      });
      await saveKanjiCache(byChar);
      const stats = await getKanjiCacheStats();
      setWkStats(stats);
      setWkResult({
        ok: true,
        message: `${user.username} (level ${user.level}) — ${stats?.count ?? 0} kanji cached.`,
      });
    } catch (e) {
      setWkResult({ ok: false, message: (e as Error).message });
    } finally {
      setWkSyncing(false);
      setWkProgress(null);
    }
  };

  const onSaveHibiKey = async () => {
    const trimmed = hibiKey.trim();
    if (trimmed.length === 0) {
      await clearHibiApiKey();
    } else {
      await setHibiApiKey(trimmed);
    }
    setHibiKeyDirty(false);
    setHibiResult(null);
  };

  const onTestHibi = async () => {
    setHibiTesting(true);
    setHibiResult(null);
    try {
      const trimmed = hibiKey.trim();
      if (trimmed.length === 0) {
        setHibiResult({ ok: false, message: 'Paste your Hibi API key first.' });
        return;
      }
      if (hibiKeyDirty) await setHibiApiKey(trimmed);
      setHibiKeyDirty(false);
      const client = await getHibiClient();
      if (!client) throw new Error('Client could not be initialized.');
      // Use the cards list endpoint as a cheap auth probe.
      const res = await client.cards.list({ limit: 1, sort: 'newest' });
      const count = res.items.length;
      setHibiResult({
        ok: true,
        message: `Connected — ${count > 0 ? 'cards present on server.' : 'no cards yet.'}`,
      });
    } catch (e) {
      setHibiResult({ ok: false, message: (e as Error).message });
    } finally {
      setHibiTesting(false);
    }
  };

  const onRetrySync = async () => {
    setRetrying(true);
    setRetryResult(null);
    try {
      const res = await syncAllPending();
      setRetryResult({
        ok: res.failed === 0,
        message:
          res.total === 0
            ? 'Nothing to sync.'
            : `Synced ${res.ok}/${res.total}` + (res.failed > 0 ? ` (${res.failed} failed)` : ''),
      });
      const pending = await listPendingMinedCards();
      setPendingCount(pending.length);
    } catch (e) {
      setRetryResult({ ok: false, message: (e as Error).message });
    } finally {
      setRetrying(false);
    }
  };

  const update = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  };

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title="OpenRouter API key">
        <Label>One key for analysis (Claude), TTS (OpenAI), and Whisper</Label>
        <TextInput
          value={apiKey}
          onChangeText={(t) => {
            setApiKeyState(t);
            setKeyDirty(true);
          }}
          placeholder="sk-or-v1-..."
          placeholderTextColor="#666"
          secureTextEntry
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.row}>
          <Pressable
            style={[styles.button, !keyDirty && styles.buttonDisabled]}
            disabled={!keyDirty}
            onPress={onSaveKey}
          >
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
          <Pressable
            style={[styles.button, (testing || apiKey.trim().length === 0) && styles.buttonDisabled]}
            disabled={testing || apiKey.trim().length === 0}
            onPress={onTest}
          >
            <Text style={styles.buttonText}>{testing ? 'Testing…' : 'Test connection'}</Text>
          </Pressable>
        </View>
        {testResult && (
          <Text style={[styles.testResult, testResult.ok ? styles.ok : styles.bad]}>
            {testResult.ok ? '✓ ' : '✗ '}
            {testResult.message}
          </Text>
        )}
      </Section>

      <Section title="Hibi API key">
        <Label>Mined cards sync to hibi-api.vercel.app</Label>
        <TextInput
          value={hibiKey}
          onChangeText={(t) => {
            setHibiKey(t);
            setHibiKeyDirty(true);
            setHibiResult(null);
          }}
          placeholder="hibi_..."
          placeholderTextColor="#666"
          secureTextEntry
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.row}>
          <Pressable
            style={[styles.button, !hibiKeyDirty && styles.buttonDisabled]}
            disabled={!hibiKeyDirty}
            onPress={onSaveHibiKey}
          >
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
          <Pressable
            style={[styles.button, (hibiTesting || hibiKey.trim().length === 0) && styles.buttonDisabled]}
            disabled={hibiTesting || hibiKey.trim().length === 0}
            onPress={onTestHibi}
          >
            <Text style={styles.buttonText}>{hibiTesting ? 'Testing…' : 'Test connection'}</Text>
          </Pressable>
        </View>
        {hibiResult && (
          <Text style={[styles.testResult, hibiResult.ok ? styles.ok : styles.bad]}>
            {hibiResult.ok ? '✓ ' : '✗ '}
            {hibiResult.message}
          </Text>
        )}
        <Label>
          {pendingCount === null
            ? ' '
            : pendingCount === 0
              ? 'No cards waiting to sync.'
              : `${pendingCount} card${pendingCount === 1 ? '' : 's'} waiting to sync.`}
        </Label>
        <View style={styles.row}>
          <Pressable
            style={[styles.button, (retrying || (pendingCount ?? 0) === 0) && styles.buttonDisabled]}
            disabled={retrying || (pendingCount ?? 0) === 0}
            onPress={onRetrySync}
          >
            <Text style={styles.buttonText}>{retrying ? 'Syncing…' : 'Retry pending syncs'}</Text>
          </Pressable>
        </View>
        {retryResult && (
          <Text style={[styles.testResult, retryResult.ok ? styles.ok : styles.bad]}>
            {retryResult.ok ? '✓ ' : '✗ '}
            {retryResult.message}
          </Text>
        )}
      </Section>

      <Section title="WaniKani (kanji info on cards)">
        <Label>Personal access token</Label>
        <TextInput
          value={wkKey}
          onChangeText={(t) => {
            setWkKey(t);
            setWkResult(null);
          }}
          placeholder="paste from wanikani.com/settings/personal_access_tokens"
          placeholderTextColor="#666"
          secureTextEntry
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.row}>
          <Pressable
            style={[styles.button, wkSyncing && styles.buttonDisabled]}
            disabled={wkSyncing}
            onPress={onSyncWanikani}
          >
            <Text style={styles.buttonText}>
              {wkSyncing
                ? wkProgress
                  ? `Syncing… ${wkProgress.done}/${wkProgress.total}`
                  : 'Syncing…'
                : wkKey.trim().length === 0
                  ? 'Disconnect'
                  : wkStats
                    ? 'Re-sync kanji'
                    : 'Save & sync kanji'}
            </Text>
          </Pressable>
        </View>
        {wkStats && (
          <Text style={styles.label}>
            {wkStats.count} kanji cached · synced {formatRelative(wkStats.fetchedAt)}
          </Text>
        )}
        {wkResult && (
          <Text style={[styles.testResult, wkResult.ok ? styles.ok : styles.bad]}>
            {wkResult.ok ? '✓ ' : '✗ '}
            {wkResult.message}
          </Text>
        )}
      </Section>

      <Section title="Theme">
        <Label>Pick a palette</Label>
        <View style={styles.choiceRow}>
          {available.map((name) => (
            <Pressable
              key={name}
              style={[styles.choice, theme === name && styles.choiceActive]}
              onPress={() => setTheme(name)}
            >
              <Text style={styles.choiceText}>{name}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Playback">
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Auto-pause at end of subtitle line</Text>
          <Switch
            value={settings.autoPauseAtLineEnd}
            onValueChange={(v) => update({ autoPauseAtLineEnd: v })}
          />
        </View>
        <Label>Default subtitle mode</Label>
        <View style={styles.choiceRow}>
          {SUB_MODES.map((m) => (
            <Pressable
              key={m}
              style={[styles.choice, settings.defaultSubtitleMode === m && styles.choiceActive]}
              onPress={() => update({ defaultSubtitleMode: m })}
            >
              <Text style={styles.choiceText}>{MODE_LABELS[m]}</Text>
            </Pressable>
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.paper },
  content: { padding: theme.space.s4, gap: theme.space.s6 },
  loading: {
    flex: 1,
    backgroundColor: theme.colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: theme.space.s2 },
  sectionTitle: {
    color: theme.colors.ink,
    fontSize: theme.typography.display.sm,
    fontFamily: theme.fonts.sansSemiBold,
    marginBottom: theme.space.s1,
  },
  label: {
    color: theme.colors.inkSoft,
    fontSize: theme.typography.meta,
    marginTop: theme.space.s2,
    fontFamily: theme.fonts.sansMedium,
  },
  input: {
    backgroundColor: theme.colors.paperAlt,
    color: theme.colors.ink,
    borderRadius: theme.radii.sm,
    padding: theme.space.s3,
    fontSize: theme.typography.bodySm,
    fontFamily: theme.fonts.sans,
  },
  row: { flexDirection: 'row', gap: theme.space.s2, marginTop: theme.space.s2 },
  button: {
    backgroundColor: theme.colors.ink,
    paddingVertical: theme.space.s2,
    paddingHorizontal: theme.space.s4,
    borderRadius: theme.radii.sm,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: theme.colors.paper, fontFamily: theme.fonts.sansSemiBold },
  testResult: { marginTop: theme.space.s2, fontSize: theme.typography.meta },
  ok: { color: theme.colors.accent },
  bad: { color: '#c0392b' },
  choiceRow: {
    flexDirection: 'row',
    gap: theme.space.s2,
    marginTop: theme.space.s1,
    flexWrap: 'wrap',
  },
  choice: {
    backgroundColor: theme.colors.paperAlt,
    paddingHorizontal: theme.space.s3,
    paddingVertical: theme.space.s2,
    borderRadius: theme.radii.sm,
  },
  choiceActive: { backgroundColor: theme.colors.accent },
  choiceText: {
    color: theme.colors.ink,
    textTransform: 'capitalize',
    fontFamily: theme.fonts.sans,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.space.s2,
  },
  toggleLabel: {
    color: theme.colors.ink,
    fontSize: theme.typography.bodySm,
    flex: 1,
    marginRight: theme.space.s3,
    fontFamily: theme.fonts.sans,
  },
}));
