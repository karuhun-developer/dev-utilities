/// <reference types="@webgpu/types" />
import { AutoProcessor, AutoTokenizer, AutomaticSpeechRecognitionPipeline, env, WhisperForConditionalGeneration } from '@huggingface/transformers';
import type { ProgressCallback } from '@huggingface/transformers';
import { assertNever, MODELS, normalizeCues, RequestSchema, SAMPLE_RATE, SubtitleError } from '../lib/audio-to-srt';
import type { Backend, Model, TranscriptionRequest, TranscriptionResponse } from '../lib/audio-to-srt';

env.allowLocalModels = false;
env.useBrowserCache = typeof caches !== 'undefined';
env.useWasmCache = typeof caches !== 'undefined';
const wasm = env.backends.onnx.wasm;
if (wasm) {
  wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
  wasm.proxy = false;
}

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;
let loadedModel: Model | null = null;
let loadedBackend: Backend | null = null;
let busy = false;

function send(message: TranscriptionResponse): void {
  self.postMessage(message);
}

async function transcribe(request: TranscriptionRequest, backend: Backend): Promise<void> {
  if (!transcriber || loadedModel !== request.model || loadedBackend !== backend) {
    if (transcriber) {
      await transcriber.dispose();
      transcriber = null;
    }
    send({ type: 'loading', id: request.id, backend });
    const model = MODELS[request.model];
    // Tokenizer metadata probes omit revision options, so pin the worker's remote path too.
    env.remotePathTemplate = `{model}/resolve/${model.revision}/`;
    const progress_callback: ProgressCallback = progress => {
      switch (progress.status) {
        case 'progress':
          send({ type: 'progress', id: request.id, percent: progress.progress, file: progress.file });
          break;
        case 'initiate':
        case 'download':
        case 'done':
        case 'ready':
        case 'progress_total':
          break;
        default:
          assertNever(progress);
      }
    };
    const options = {
      revision: model.revision,
      progress_callback,
    };
    // Load the known Whisper components without generic pipeline metadata probes.
    const [tokenizer, processor, whisper] = await Promise.all([
      AutoTokenizer.from_pretrained(model.id, options),
      AutoProcessor.from_pretrained(model.id, options),
      WhisperForConditionalGeneration.from_pretrained(model.id, {
        ...options,
        device: backend,
        dtype: backend === 'webgpu' ? { encoder_model: 'fp32', decoder_model_merged: 'q4' } : 'q8',
      }),
    ]);
    transcriber = new AutomaticSpeechRecognitionPipeline({
      task: 'automatic-speech-recognition', model: whisper, tokenizer, processor,
    });
    loadedModel = request.model;
    loadedBackend = backend;
  }
  send({ type: 'transcribing', id: request.id, backend });
  const duration = request.audio.length / SAMPLE_RATE;
  const result: unknown = await transcriber(request.audio, {
    return_timestamps: true,
    task: 'transcribe',
    ...(request.language === 'auto' ? {} : { language: request.language }),
    ...(duration > 29 ? { chunk_length_s: 29, stride_length_s: 5 } : {}),
    no_repeat_ngram_size: 3,
  });
  send({ type: 'complete', id: request.id, backend, cues: normalizeCues(result, duration) });
}

self.onmessage = async (event: MessageEvent<unknown>) => {
  const parsed = RequestSchema.safeParse(event.data);
  if (!parsed.success || busy) return;
  busy = true;
  const request = parsed.data;
  try {
    const backend = request.backend === 'wasm' ? 'wasm' : loadedBackend ?? ('gpu' in navigator ? 'webgpu' : 'wasm');
    try {
      if (backend === 'webgpu') {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          const message: TranscriptionResponse = { type: 'fallback', id: request.id, audio: request.audio };
          self.postMessage(message, { transfer: [request.audio.buffer] });
          return;
        }
      }
      await transcribe(request, backend);
    } catch (error) {
      if (backend !== 'webgpu' || error instanceof SubtitleError) throw error;
      // A failed GPU initialization poisons the runtime session chain; retry in a fresh worker.
      const message: TranscriptionResponse = { type: 'fallback', id: request.id, audio: request.audio };
      self.postMessage(message, { transfer: [request.audio.buffer] });
    }
  } catch (error) {
    send({
      type: 'error',
      id: request.id,
      message: error instanceof Error ? error.message : 'The model could not transcribe this audio.',
    });
  } finally {
    busy = false;
  }
};
