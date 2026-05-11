# Hibi Toru

A Japanese immersion video player for the Hibi ecosystem. Pair a video file with an `.srt` subtitle, run a one-time analysis, watch with tap-to-define dictionary popups, and mine cards directly into the [Hibi](https://hibi-api.vercel.app) backend for FSRS-scheduled review in [Hibi-Koe](https://github.com/yherrero/hibi-koe) or the Hibi portal.

Built with Expo / React Native. Forked from [Pureyaa](https://github.com/yherrero/pureyaa); the Anki-only export path has been replaced with `hibi-client`.

## Features

- Three-tab navigation: **Library**, **Saved Words**, **Settings**.
- Subtitle modes: **JP only** (default, tap to reveal translation), **JP + EN**, **EN only**.
- Tap a token → pause + dictionary popup with longest-match definitions.
- **+ Mine** button on the popup opens a preview sheet, then writes the card to Hibi.
- Audio clip + cue-midpoint thumbnail extracted from the video and uploaded to Supabase Storage via the Hibi SDK.
- Local SQLite tracks `mined_cards` sync state (`pending`/`syncing`/`synced`/`failed`); failed rows can be retried from Settings.
- Saved Words for offline lookup of mined vocab from the player.
- Library: series grouping, search, sort, long-press context menus, retimer, watched badge.
- Five Torakaa palettes (paper / stone / sage / clay / ink) switchable from Settings.

## Architecture

```
app/                      expo-router routes
  (tabs)/                 library / saved / settings
  add/                    add-to-library flow
  onboarding/
  player/[id].tsx         video player
src/
  hibi/                   Hibi integration (NEW)
    hibiClient.ts         createHibiClient() singleton
    hibiApiKey.ts         SecureStore wrapper
    buildCard.ts          assemble CreateCardInput from cue + dict entry
    media.ts              audio/thumbnail extraction
    furigana.ts           segmentFurigana()
    kanjiList.ts          extractKanjiList()
    HibiPreviewSheet.tsx  editable preview before submission
    submit.ts             insertMinedCard + syncCard
    sync.ts               syncCard / syncAllPending
  db/                     expo-sqlite + migrations (NEW)
    client.ts
    migrations.ts
    minedCards.ts         repo for mined_cards
  theme/                  Torakaa via Unistyles (NEW)
    colors.ts, fonts.ts, tokens.ts, themes.ts, unistyles.ts,
    useThemeSwitcher.ts
  ui/                     Torakaa primitives (Button, Field, Label, …)
  analysis/               SRT parser, tokenizer, dict matcher, Claude client
  player/                 video + subtitle components
  storage/                AsyncStorage entries / savedWords / settings
  utils/                  filename, time, retimer math
modules/
  audio-extract/          native MP4 audio extractor (Android+iOS)
  file-access/            persistent file URI grants
```

## Setup

```bash
pnpm install
pnpm expo prebuild       # only if you customize native config
pnpm android             # or `pnpm start` and use the dev client
```

Open the app, go to **Settings**, and paste:

- **OpenRouter API key** — for the one-time analysis (Claude) and WaniKani sync.
- **Hibi API key** — required to mine cards. Use the **Test connection** button to verify.

## Dictionary data

The repo ships with empty placeholders for JMDict / JMnedict. Populate them per the [original Pureyaa instructions](https://github.com/yherrero/pureyaa#dictionary-data).

## Privacy

- Cue text is sent to the Claude API during the analysis phase (once per library entry).
- Mined cards (sentence, audio clip, thumbnail) are sent to your Hibi account when you press **+ Mine**.
- Both keys are stored in `expo-secure-store`. No telemetry.

## License

MIT — see [LICENSE](./LICENSE).

## Acknowledgements

- [Pureyaa](https://github.com/yherrero/pureyaa) — base app.
- [Hibi-Koe](https://github.com/yherrero/hibi-koe) — reference integration for the Hibi client + Torakaa design system.
- [JMDict / JMnedict](https://www.edrdg.org/jmdict/edict.html) — © EDRDG, used under the EDRDG license.
- [kuromoji](https://github.com/atilika/kuromoji) — Apache 2.0.
