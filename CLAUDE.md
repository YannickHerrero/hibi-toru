# Hibi Toru — working notes for AI assistants

Japanese language-learning app that mines anime subtitles into cards
in the Hibi ecosystem (FSRS-scheduled review via `hibi-client` against
the Hibi backend). Android and iOS are both supported; iPad is
enabled so the iOS build also installs on Apple Vision Pro via
"Designed for iPad". Expo SDK 55, React Native 0.83, Hermes, New
Architecture.

## 1. Working style for this repo

- **Many small atomic commits — the more the better.** Each commit
  should leave the tree compiling. Intermediate states with broken
  types are acceptable only if the next commit fixes them and they
  land back-to-back.
- **Always state JS-only vs requires-rebuild** when finishing a task.
  EAS builds cost real money — the user needs to know whether to
  reload the dev client or kick off a paid build. Anything that
  touches `app.json`, `eas.json`, a `modules/*/` native source file,
  or adds a dep with a native side requires a rebuild.
- **Don't touch pre-existing diffs in the working tree** that weren't
  part of your task (e.g., random `eas.json` / `expo-env.d.ts`
  modifications already there at session start).
- **Type-check before committing** with `pnpm typecheck` (or
  `npx tsc --noEmit` if node_modules is present). One known
  pre-existing error to filter from output:
  - `kuromoji-react-native` missing declaration file.

  Anything else is yours.

## 2. AI service architecture (single OpenRouter key)

- **One key for all AI**: OpenRouter handles Claude analysis
  (`anthropic/claude-sonnet-4.5`), Whisper subtitle generation
  (`openai/whisper-large-v3-turbo`), and TTS
  (`openai/gpt-4o-audio-preview`). Stored in `expo-secure-store`
  under `hibi-toru.openrouterApiKey` (see `src/storage/keys.ts`
  `SECURE_KEYS`).
- **WaniKani is separate** (account-bound, kanji-only). Stored under
  `hibi-toru.wanikaniApiKey`. Bulk-fetched + cached locally on key
  save so card creation is offline.
- **Hibi API key** is stored under `hibi-toru.hibiApiKey` and is
  required for any mining action. See §3.
- **OpenRouter API quirks** — partially OpenAI-compatible but diverges
  in two important places:
  - `/audio/transcriptions` is **not** multipart. It expects JSON with
    `input_audio: { data: <base64>, format: "<ext>" }`. Multipart
    payloads get parsed as JSON server-side and fail with "no number
    after minus sign in JSON at position 1".
  - `response_format: 'srt'` is silently dropped. Use
    `response_format: 'verbose_json'` + `timestamp_granularities:
    ['segment']` and build the SRT in JS from the segments array.
  - TTS goes through `/chat/completions` with
    `model=openai/gpt-4o-audio-preview`,
    `modalities=['text','audio']`, `audio={voice, format:'mp3'}`.
    Audio comes back as base64 in `choices[0].message.audio.data`.

## 3. Hibi integration (mining cards)

- **All card mining goes through `hibi-client`** against the Hibi
  backend. There is no Anki integration anymore — the Anki-only
  export path inherited from Pureyaa was removed in favour of the
  cross-platform Hibi API. Anything that says "Anki" in scrollback
  or memory is stale.
- **Code lives under `src/hibi/`**:
  - `hibiClient.ts` — `createHibiClient()` singleton against the API
    key.
  - `hibiApiKey.ts` — SecureStore wrapper around
    `SECURE_KEYS.hibiApiKey`.
  - `buildCard.ts` — assembles a `CreateCardInput` from a cue + dict
    entry.
  - `media.ts` — audio/thumbnail extraction wrappers (cross-platform).
  - `furigana.ts` / `kanjiList.ts` — segmentation + kanji extraction.
  - `HibiPreviewSheet.tsx` — editable preview before submission.
  - `submit.ts` / `sync.ts` — `insertMinedCard` + `syncCard` /
    `syncAllPending`.
- **Local SQLite (`src/db/`)** tracks `mined_cards` sync state with
  states `pending`/`syncing`/`synced`/`failed`. Failed rows can be
  retried from Settings.
- **No platform gating needed for mining.** Both Android and iOS run
  the same Hibi flow end-to-end. There is no Android-only export path.

## 4. SAF / security-scoped URI persistence

- **Picker-returned URIs don't auto-persist.** Without persistence,
  every cold start invalidates the saved `videoUri` and the entry
  shows "file unavailable".
- **Every DocumentPicker result we plan to keep** must be followed by
  `await FileAccess.persistFileAccess(uri)` (see
  `modules/file-access/`). The handle returned is what to store in
  `entry.videoUri`:
  - On Android the handle equals the URI string (wraps
    `takePersistableUriPermission`).
  - On iOS the handle is a base64 security-scoped bookmark blob.
- **expo-router URL-encodes route params**, so URIs round-tripped
  through `router.push({ params })` come out the other side with
  slightly different encoding. The transient session grant tolerates
  fuzzy matching but the persistent grant is exact-match.
  **Re-persist on the receiving side** immediately before saving the
  entry.
- **Reads must run inside a session.** Long-lived consumers (the
  video player) own their own `beginSession` / `endSession` pair;
  short-lived ones (thumbnail / audio extract) should use
  `withSession()` from the file-access shim. No-op on Android,
  scope-managed on iOS.

## 5. Media + time handling

- **Cue times are subtitle clock; the video file is video clock.**
  Always apply the retimer via `effectiveStartMs(cue, retimerState)` /
  `effectiveEndMs(cue, retimerState)` (in `src/utils/time.ts`) before
  passing times to native extractors (`extractThumbnail`,
  `extractAudio`). Forgetting this puts media seconds off the spoken
  line whenever the user has any sync offset.
- Native module `modules/audio-extract/` is cross-platform:
  - Android (Kotlin MediaExtractor + MediaCodec): AAC remux fast
    path, Opus → ogg, anything else transcodes to AAC. Drain-encoder-
    first pipeline order avoids deadlocks; `channelCount > 6` fails
    with a clear error before `encoder.configure` would throw a
    generic one.
  - iOS (`AVAssetExportSession`, AppleM4A preset): always re-encodes
    to AAC inside an `.m4a` container regardless of source codec.
    Trades the Kotlin module's codec fast-paths for simplicity — the
    cost is negligible for typical file sizes.

## 6. Cross-platform conventions (Android + iOS / iPad / Vision Pro)

- **No per-platform feature flags right now.** The feature surface
  is identical across Android and iOS. Anything that used to live
  behind `ANKI_AVAILABLE` is gone — don't reintroduce a
  `src/featureFlags.ts` unless a genuinely platform-divergent feature
  shows up.
- **`audio-extract` and `file-access` are cross-platform** with
  Kotlin + Swift native modules. JS shims live in each module's
  `src/index.ts` and use `requireNativeModule` — no `Platform.OS`
  branching needed in the shim itself.
- **`file-access` handle format is platform-specific** but the JS
  surface is uniform: on Android the handle == the URI string; on
  iOS it's a base64 security-scoped bookmark. Always wrap reads in
  `withSession()` (no-op on Android, scope-managed on iOS).
- **`uriExists` (`src/utils/uriCheck.ts`) resolves via
  `FileAccess.beginSession`** before probing, so it works for both
  Android URIs and iOS bookmarks.
- **Cross-platform toasts** via `src/ui/Toast.tsx` (`showToast()`).
  Backed by `ToastAndroid` on Android, an animated bottom pill via
  `<ToastHost />` on iOS. Don't import `ToastAndroid` directly.
- **iPad / Vision Pro**: `app.json` has `ios.supportsTablet: true`,
  which makes the iOS build run on iPad natively and on Apple Vision
  Pro via the "Designed for iPad" compatibility layer. Root
  orientation is still `portrait` — the app runs portrait-shaped in
  a window on Vision Pro. Revisit if/when we do an iPad-native
  layout pass.

## 7. Other project facts

- **Whisper track-picker for dual-audio rips is intentionally
  deferred.** Would need `listAudioTracks` methods (Kotlin and Swift)
  + a rebuild. Current behavior picks the first audio track, which
  works for monolingual rips. Symptom of the missing feature: a JP/EN
  dual audio file transcribes the dub.
- **Hermes property limit (196k)**: the dict bundle uses `Map<>` at
  runtime; the on-disk format is array-of-pairs to avoid the
  per-object property cap. Don't switch to plain object literals for
  large maps.
