import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { Cue, DictName, LibraryEntry } from '@/types';
import type { DictEntry } from '@/analysis/dict';
import { buildCard, type BuiltCard } from './buildCard';
import { deleteLocalMedia } from './media';

export interface HibiPreviewArgs {
  cue: Cue;
  dict: DictName;
  dictEntry: DictEntry;
  tokenSpan: [number, number];
}

export interface HibiPreviewSheetProps {
  visible: boolean;
  args: HibiPreviewArgs | null;
  entry: LibraryEntry;
  onClose: () => void;
  /**
   * Called after the user confirms the (edited) payload. Implementer is
   * responsible for inserting a `mined_cards` row + kicking off sync.
   */
  onSubmit: (built: BuiltCard) => Promise<void>;
  onSent?: () => void;
}

type EditableFields = {
  english: string;
  grammarNote: string;
  glossesCsv: string;
  tagsCsv: string;
};

type Phase =
  | { kind: 'building' }
  | { kind: 'ready'; built: BuiltCard; fields: EditableFields }
  | { kind: 'sending'; built: BuiltCard; fields: EditableFields }
  | { kind: 'error'; message: string };

function csvToList(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

export function HibiPreviewSheet(props: HibiPreviewSheetProps) {
  const { visible, args, entry, onClose, onSubmit, onSent } = props;
  const [phase, setPhase] = useState<Phase>({ kind: 'building' });

  useEffect(() => {
    if (!visible || !args) return;
    let cancelled = false;
    setPhase({ kind: 'building' });
    (async () => {
      try {
        const built = await buildCard({
          entry,
          cue: args.cue,
          dict: args.dict,
          dictEntry: args.dictEntry,
          videoUri: entry.videoUri,
        });
        if (cancelled) {
          deleteLocalMedia(built.thumbnailUri);
          deleteLocalMedia(built.clip.audioUri);
          return;
        }
        setPhase({
          kind: 'ready',
          built,
          fields: {
            english: built.payload.english,
            grammarNote: built.payload.grammarNote ?? '',
            glossesCsv: built.payload.glosses.join(', '),
            tagsCsv: built.payload.tags.join(', '),
          },
        });
      } catch (e) {
        if (!cancelled) setPhase({ kind: 'error', message: (e as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, args, entry]);

  const setField = (patch: Partial<EditableFields>) => {
    setPhase((p) => (p.kind === 'ready' ? { ...p, fields: { ...p.fields, ...patch } } : p));
  };

  const onSubmitPress = async () => {
    if (phase.kind !== 'ready') return;
    const { built, fields } = phase;
    const next: BuiltCard = {
      ...built,
      payload: {
        ...built.payload,
        english: fields.english,
        grammarNote: fields.grammarNote.trim().length === 0 ? null : fields.grammarNote.trim(),
        glosses: csvToList(fields.glossesCsv),
        tags: csvToList(fields.tagsCsv),
      },
    };
    setPhase({ kind: 'sending', built: next, fields });
    try {
      await onSubmit(next);
      onSent?.();
      onClose();
    } catch (e) {
      setPhase({ kind: 'error', message: (e as Error).message });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mine to Hibi</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {phase.kind === 'building' && (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.muted}>Extracting audio + thumbnail…</Text>
            </View>
          )}
          {phase.kind === 'error' && (
            <View style={styles.center}>
              <Text style={styles.error}>{phase.message}</Text>
            </View>
          )}
          {(phase.kind === 'ready' || phase.kind === 'sending') && (
            <Preview
              built={phase.built}
              fields={phase.fields}
              disabled={phase.kind === 'sending'}
              onChange={setField}
            />
          )}
        </ScrollView>
        {(phase.kind === 'ready' || phase.kind === 'sending') && (
          <View style={styles.footer}>
            <Pressable
              style={[styles.submit, phase.kind === 'sending' && styles.submitDisabled]}
              disabled={phase.kind === 'sending'}
              onPress={onSubmitPress}
            >
              <Text style={styles.submitText}>
                {phase.kind === 'sending' ? 'Sending…' : 'Add to Hibi'}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Preview({
  built,
  fields,
  disabled,
  onChange,
}: {
  built: BuiltCard;
  fields: EditableFields;
  disabled: boolean;
  onChange: (patch: Partial<EditableFields>) => void;
}) {
  return (
    <View style={styles.previewRoot}>
      <Image source={{ uri: built.thumbnailUri }} style={styles.thumb} resizeMode="contain" />

      <FieldLabel>Sentence</FieldLabel>
      <Text style={styles.staticField}>{built.payload.sentence}</Text>

      <FieldLabel>Focus word</FieldLabel>
      <Text style={styles.staticField}>
        {built.payload.focusWord}
        {built.payload.focusWordReading && built.payload.focusWordReading !== built.payload.focusWord
          ? ` (${built.payload.focusWordReading})`
          : ''}
      </Text>

      <FieldLabel>English translation</FieldLabel>
      <TextInput
        value={fields.english}
        editable={!disabled}
        onChangeText={(t) => onChange({ english: t })}
        style={styles.input}
        multiline
      />

      <FieldLabel>Grammar note</FieldLabel>
      <TextInput
        value={fields.grammarNote}
        editable={!disabled}
        onChangeText={(t) => onChange({ grammarNote: t })}
        style={styles.input}
        multiline
        placeholder="(optional)"
        placeholderTextColor="#888"
      />

      <FieldLabel>Glosses (comma-separated)</FieldLabel>
      <TextInput
        value={fields.glossesCsv}
        editable={!disabled}
        onChangeText={(t) => onChange({ glossesCsv: t })}
        style={styles.input}
        multiline
      />

      <FieldLabel>Tags (comma-separated)</FieldLabel>
      <TextInput
        value={fields.tagsCsv}
        editable={!disabled}
        onChangeText={(t) => onChange({ tagsCsv: t })}
        style={styles.input}
      />

      {built.payload.kanjiList.length > 0 && (
        <>
          <FieldLabel>Kanji</FieldLabel>
          <Text style={styles.staticField}>
            {built.payload.kanjiList.map((k) => k.kanji).join('  ')}
          </Text>
        </>
      )}
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.s4,
    paddingTop: theme.space.s4,
    paddingBottom: theme.space.s2,
  },
  headerTitle: {
    fontFamily: theme.fonts.sansSemiBold,
    color: theme.colors.ink,
    fontSize: theme.typography.display.sm,
  },
  close: {
    color: theme.colors.inkSoft,
    fontSize: 22,
  },
  body: {
    padding: theme.space.s4,
    paddingBottom: theme.space.s7,
    gap: theme.space.s2,
  },
  center: {
    paddingVertical: theme.space.s8,
    alignItems: 'center',
    gap: theme.space.s3,
  },
  muted: { color: theme.colors.inkSoft },
  error: { color: theme.colors.accent, textAlign: 'center' },
  previewRoot: { gap: theme.space.s2 },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radii.sm,
    marginBottom: theme.space.s2,
  },
  label: {
    color: theme.colors.inkSoft,
    fontSize: theme.typography.meta,
    fontFamily: theme.fonts.sansMedium,
    marginTop: theme.space.s2,
  },
  staticField: {
    color: theme.colors.ink,
    fontSize: theme.typography.body,
    fontFamily: theme.fonts.serif,
    paddingVertical: theme.space.s1,
  },
  input: {
    backgroundColor: theme.colors.paperAlt,
    color: theme.colors.ink,
    borderRadius: theme.radii.sm,
    padding: theme.space.s3,
    fontSize: theme.typography.bodySm,
    fontFamily: theme.fonts.sans,
    minHeight: 44,
  },
  footer: {
    padding: theme.space.s4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.ruleSoft,
  },
  submit: {
    backgroundColor: theme.colors.ink,
    paddingVertical: theme.space.s3,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    color: theme.colors.paper,
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: theme.typography.bodySm,
  },
}));
