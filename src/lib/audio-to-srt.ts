import { z } from 'zod';

export const SAMPLE_RATE = 16_000;
export const MODELS = {
  tiny: {
    label: 'Whisper Tiny',
    id: 'onnx-community/whisper-tiny_timestamped',
    revision: '517244293732ee2d58139af5814231b7e6830a0d',
    download: '~40 MB on CPU / ~120 MB on GPU',
  },
  base: {
    label: 'Whisper Base',
    id: 'onnx-community/whisper-base_timestamped',
    revision: '608c49e61301901684bc36cac8f74b95ff6b5a8e',
    download: '~77 MB on CPU / ~206 MB on GPU',
  },
} as const;

export const LANGUAGES = {
  auto: 'Auto detect',
  indonesian: 'Indonesian',
  english: 'English',
  malay: 'Malay',
  javanese: 'Javanese',
  sundanese: 'Sundanese',
  japanese: 'Japanese',
  korean: 'Korean',
  chinese: 'Chinese',
  arabic: 'Arabic',
  hindi: 'Hindi',
  spanish: 'Spanish',
  french: 'French',
  german: 'German',
  portuguese: 'Portuguese',
  russian: 'Russian',
  thai: 'Thai',
  vietnamese: 'Vietnamese',
} as const;

export const ModelSchema = z.enum(['tiny', 'base']);
export const LanguageSchema = z.enum(Object.keys(LANGUAGES));
export type Model = z.infer<typeof ModelSchema>;
export type Backend = 'webgpu' | 'wasm';

export const RequestSchema = z.object({
  id: z.number().int().nonnegative(),
  model: ModelSchema,
  language: LanguageSchema,
  backend: z.enum(['auto', 'wasm']),
  audio: z.instanceof(Float32Array),
});
export type TranscriptionRequest = z.infer<typeof RequestSchema>;

export const CueSchema = z.object({
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
  text: z.string(),
});
// Cue text is editable Alpine state; timings come from the model.
export type SubtitleCue = z.infer<typeof CueSchema>;

const backendSchema = z.enum(['webgpu', 'wasm']);
export const ResponseSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('loading'), id: z.number(), backend: backendSchema }),
  z.object({ type: z.literal('progress'), id: z.number(), percent: z.number(), file: z.string() }),
  z.object({ type: z.literal('fallback'), id: z.number(), audio: z.instanceof(Float32Array) }),
  z.object({ type: z.literal('transcribing'), id: z.number(), backend: backendSchema }),
  z.object({ type: z.literal('complete'), id: z.number(), backend: backendSchema, cues: z.array(CueSchema) }),
  z.object({ type: z.literal('error'), id: z.number(), message: z.string() }),
]);
export type TranscriptionResponse = z.infer<typeof ResponseSchema>;

const resultSchema = z.object({
  text: z.string(),
  chunks: z.array(z.object({
    text: z.string(),
    timestamp: z.tuple([z.number().nullable(), z.number().nullable()]),
  })).optional(),
});

export class SubtitleError extends Error {
  readonly name = 'SubtitleError';
}

export function assertNever(value: never): never {
  throw new SubtitleError(`Unexpected transcription state: ${String(value)}`);
}

function cleanText(text: string): string {
  return text.replace(/\r\n?/g, '\n').split('\n').map(line => line.trim()).filter(Boolean).join('\n');
}

export function normalizeCues(raw: unknown, durationSeconds: number): SubtitleCue[] {
  const result = resultSchema.parse(raw);
  const durationMs = Math.round(durationSeconds * 1000);
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new SubtitleError('The audio has no usable duration.');
  }
  if (!result.chunks?.length) {
    if (!result.text.trim()) return [];
    throw new SubtitleError('The model returned text without subtitle timings. Please try again.');
  }

  const cues: SubtitleCue[] = [];
  for (const [index, chunk] of result.chunks.entries()) {
    const text = cleanText(chunk.text);
    if (!text) continue;
    const [start, end] = chunk.timestamp;
    if (start === null || start < 0 || (end !== null && end < start)) {
      throw new SubtitleError('The model returned invalid subtitle timings. Please try again.');
    }
    const startMs = Math.round(start * 1000);
    const nextStart = result.chunks[index + 1]?.timestamp[0];
    const endSeconds = end ?? nextStart ?? durationSeconds;
    const endMs = Math.min(durationMs, Math.round(endSeconds * 1000));
    const previous = cues.at(-1);
    if (startMs >= endMs || (previous && startMs < previous.startMs)) {
      throw new SubtitleError('The model returned invalid subtitle timings. Please try again.');
    }
    cues.push({ startMs, endMs, text });
  }
  return cues;
}

export function formatTimestamp(milliseconds: number): string {
  const total = Math.max(0, Math.round(milliseconds));
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor(total / 60_000) % 60;
  const seconds = Math.floor(total / 1000) % 60;
  const ms = total % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function serializeSrt(cues: readonly SubtitleCue[]): string {
  return cues.map(cue => ({ ...cue, text: cleanText(cue.text) })).filter(cue => cue.text).map((cue, index) =>
    `${index + 1}\r\n${formatTimestamp(cue.startMs)} --> ${formatTimestamp(cue.endMs)}\r\n${cue.text.replace(/\n/g, '\r\n')}\r\n`,
  ).join('\r\n');
}
