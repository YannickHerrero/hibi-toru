import { Directory, File, Paths } from 'expo-file-system';
import { extractAudio } from 'audio-extract';
import { extractThumbnail } from '@/utils/thumbnail';

const CLIP_DIR_NAME = 'hibi-clips';
const MAX_AUDIO_DURATION_MS = 30_000;

export interface ExtractedClip {
  audioUri: string;
  audioFilename: string;
  audioStartMs: number;
  audioEndMs: number;
}

function clipDir(): Directory {
  const dir = new Directory(Paths.cache, CLIP_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/**
 * Extract a JPG thumbnail at `positionMs` of the video at `videoUri`.
 * Returns the cached file URI for upload to Hibi.
 */
export async function extractCardThumbnail(
  videoUri: string,
  cardId: string,
  positionMs: number,
): Promise<string> {
  const filename = `hibi_${cardId}.jpg`;
  const outPath = new File(clipDir(), filename).uri;
  const { uri } = await extractThumbnail(videoUri, outPath, Math.max(0, Math.floor(positionMs)));
  return uri;
}

/**
 * Extract an audio clip from the video covering `[startMs, endMs]` (with
 * the caller's chosen padding already applied). Caps total duration to
 * MAX_AUDIO_DURATION_MS so a runaway cue can't produce a 5-minute file.
 */
export async function extractCardAudio(args: {
  videoUri: string;
  cardId: string;
  startMs: number;
  endMs: number;
}): Promise<ExtractedClip> {
  const start = Math.max(0, Math.floor(args.startMs));
  const end = Math.max(start, Math.min(args.endMs, start + MAX_AUDIO_DURATION_MS));
  const requestedFilename = `hibi_${args.cardId}.m4a`;
  const outPath = new File(clipDir(), requestedFilename).uri;
  const audioUri = await extractAudio(args.videoUri, {
    startMs: start,
    endMs: end,
    outPath,
  });
  const audioFilename = audioUri.split('/').pop() ?? requestedFilename;
  return { audioUri, audioFilename, audioStartMs: start, audioEndMs: end };
}

/** Best-effort delete of a cached media file. Swallows missing-file errors. */
export function deleteLocalMedia(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // ignore
  }
}
