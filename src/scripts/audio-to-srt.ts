import { assertNever, formatTimestamp, LanguageSchema, ModelSchema, MODELS, ResponseSchema, SAMPLE_RATE, serializeSrt, SubtitleError } from '../lib/audio-to-srt';
import type { Backend, SubtitleCue, TranscriptionRequest } from '../lib/audio-to-srt';

type Stage = 'idle' | 'decoding' | 'loading' | 'transcribing' | 'done' | 'error';
type AppState = {
  stage: Stage;
  isDragging: boolean;
  fileName: string;
  fileSize: string;
  audioUrl: string;
  durationSeconds: number;
  selectedModel: string;
  selectedLanguage: string;
  backend: Backend | '';
  statusText: string;
  downloadFile: string;
  downloadPercent: number;
  usedFallback: boolean;
  cues: SubtitleCue[];
};
const audioExtension = /\.(mp3|wav|wave|m4a|aac|ogg|oga|opus|flac|webm|aiff|aif)$/i;

async function decodeAudio(file: File, signal: AbortSignal): Promise<Float32Array<ArrayBuffer>> {
  const bytes = await file.arrayBuffer();
  signal.throwIfAborted();
  const decoder = new OfflineAudioContext(1, 1, SAMPLE_RATE);
  const decoded = await decoder.decodeAudioData(bytes);
  signal.throwIfAborted();
  if (!decoded.length) throw new SubtitleError('The audio file is empty.');
  const mono = new Float32Array(decoded.length);
  for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
    const samples = decoded.getChannelData(channel);
    for (let i = 0; i < samples.length; i++) mono[i] += samples[i] / decoded.numberOfChannels;
  }
  signal.throwIfAborted();
  return mono;
}

export function createAudioToSrtApp() {
  let file: File | null = null;
  let worker: Worker | null = null;
  let job = 0;
  let controller: AbortController | null = null;

  const state: AppState = {
    stage: 'idle',
    isDragging: false,
    fileName: '',
    fileSize: '',
    audioUrl: '',
    durationSeconds: 0,
    selectedModel: 'tiny',
    selectedLanguage: 'auto',
    backend: '',
    statusText: '',
    downloadFile: '',
    downloadPercent: 0,
    usedFallback: false,
    cues: [],
  };
  return {
    ...state,

    get isBusy(): boolean {
      return this.stage === 'decoding' || this.stage === 'loading' || this.stage === 'transcribing';
    },
    get canDownload(): boolean {
      return this.cues.some(cue => cue.text.trim().length > 0) && !this.isBusy;
    },
    get modelDownload(): string {
      const parsed = ModelSchema.safeParse(this.selectedModel);
      return parsed.success ? MODELS[parsed.data].download : '';
    },
    get durationLabel(): string {
      return this.durationSeconds ? formatTimestamp(this.durationSeconds * 1000).replace(',', '.') : '';
    },
    formatTimestamp,

    handleUpload(event: Event): void {
      if (!(event.target instanceof HTMLInputElement)) return;
      const selected = event.target.files?.[0];
      if (selected) this.selectFile(selected);
      event.target.value = '';
    },
    onDrop(event: DragEvent): void {
      this.isDragging = false;
      if (this.isBusy) return;
      const files = event.dataTransfer?.files;
      if (!files?.length) return;
      if (files.length > 1) {
        this.stage = 'error';
        this.statusText = 'Choose one audio file at a time.';
        return;
      }
      this.selectFile(files[0]);
    },
    selectFile(selected: File): void {
      if (this.isBusy) return;
      if (!selected.size || selected.type.startsWith('video/') || (!selected.type.startsWith('audio/') && !audioExtension.test(selected.name))) {
        this.stage = 'error';
        this.statusText = 'Choose a non-empty audio file, such as MP3, WAV, or M4A.';
        return;
      }
      this.reset();
      file = selected;
      this.fileName = selected.name;
      this.fileSize = selected.size < 100_000 ? `${Math.ceil(selected.size / 1000)} KB` : `${(selected.size / 1_000_000).toFixed(1)} MB`;
      this.audioUrl = URL.createObjectURL(selected);
    },
    readDuration(event: Event): void {
      if (event.target instanceof HTMLAudioElement && Number.isFinite(event.target.duration)) {
        this.durationSeconds = event.target.duration;
      }
    },
    cancel(): void {
      job++;
      controller?.abort();
      controller = null;
      worker?.terminate();
      worker = null;
      this.stage = 'idle';
      this.statusText = 'Cancelled. You can try again; completed model downloads stay cached.';
      this.downloadFile = '';
      this.downloadPercent = 0;
    },
    reset(): void {
      this.cancel();
      if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
      file = null;
      this.audioUrl = '';
      this.fileName = '';
      this.fileSize = '';
      this.durationSeconds = 0;
      this.cues = [];
      this.backend = '';
      this.usedFallback = false;
      this.statusText = '';
    },
    destroy(): void {
      this.reset();
    },
    async transcribe(): Promise<void> {
      if (!file || this.isBusy) return;
      const selectedFile = file;
      const id = ++job;
      controller = new AbortController();
      const signal = controller.signal;
      this.stage = 'decoding';
      this.statusText = 'Preparing audio…';
      this.cues = [];
      this.downloadFile = '';
      this.downloadPercent = 0;
      this.usedFallback = false;
      try {
        const model = ModelSchema.parse(this.selectedModel);
        const language = LanguageSchema.parse(this.selectedLanguage);
        const audio = await decodeAudio(selectedFile, signal);
        signal.throwIfAborted();
        if (job !== id) return;
        this.durationSeconds = audio.length / SAMPLE_RATE;
        this.stage = 'loading';
        this.statusText = 'Loading AI runtime and model…';
        this.runWorker({ id, model, language, backend: 'auto', audio });
      } catch (error) {
        if (signal.aborted || job !== id) return;
        this.stage = 'error';
        this.statusText = error instanceof SubtitleError ? error.message : error instanceof Error
          ? 'This audio could not be decoded. Try MP3 or WAV, or a format supported by your browser.'
          : 'The audio could not be prepared. Please try another file.';
        controller = null;
      }
    },
    runWorker(request: TranscriptionRequest): void {
      try {
        const { id, audio } = request;
        if (!worker) worker = new Worker(new URL('../workers/audio-to-srt.worker.ts', import.meta.url), { type: 'module' });
        const activeWorker = worker;
        activeWorker.onmessage = (event: MessageEvent<unknown>) => {
          if (job !== id) return;
          const parsed = ResponseSchema.safeParse(event.data);
          if (!parsed.success || parsed.data.id !== id) return;
          const message = parsed.data;
          switch (message.type) {
            case 'loading':
              this.stage = 'loading';
              this.backend = message.backend;
              this.statusText = 'Loading model… Cached files are reused when available.';
              break;
            case 'progress':
              this.downloadPercent = Math.min(100, Math.max(0, message.percent));
              this.downloadFile = message.file;
              break;
            case 'fallback':
              this.usedFallback = true;
              this.backend = 'wasm';
              this.downloadPercent = 0;
              this.downloadFile = '';
              this.stage = 'loading';
              this.statusText = 'GPU processing was unavailable. Retrying on CPU…';
              activeWorker.terminate();
              worker = null;
              this.runWorker({ ...request, backend: 'wasm', audio: message.audio });
              break;
            case 'transcribing':
              this.stage = 'transcribing';
              this.backend = message.backend;
              this.statusText = 'Transcribing on your device… Longer audio takes more time.';
              this.downloadFile = '';
              break;
            case 'complete':
              this.stage = 'done';
              this.backend = message.backend;
              this.cues = message.cues;
              this.statusText = message.cues.length ? 'Subtitles are ready. Review the text before downloading.' : 'No timed speech was detected. Try clearer audio or select its language.';
              controller = null;
              break;
            case 'error':
              this.failWorker(id, `Transcription failed. Check your connection and available memory, then try again. ${message.message}`);
              break;
            default:
              assertNever(message);
          }
        };
        activeWorker.onerror = () => {
          this.failWorker(id, 'The AI worker could not start. Reload the page and check that your browser supports WebAssembly.');
        };
        activeWorker.postMessage(request, [audio.buffer]);
      } catch {
        this.failWorker(request.id, 'The AI worker could not start. Reload the page and check that your browser supports WebAssembly.');
      }
    },
    failWorker(id: number, message: string): void {
      if (job !== id) return;
      this.stage = 'error';
      this.statusText = message;
      worker?.terminate();
      worker = null;
      controller = null;
    },
    download(): void {
      if (!this.canDownload) return;
      const contents = serializeSrt(this.cues);
      const url = URL.createObjectURL(new Blob([contents], { type: 'application/x-subrip;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.fileName.replace(/\.[^.]+$/, '') || 'subtitles'}.srt`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  };
}
