# Karuhun DevUtils

A collection of fast, free, and privacy-focused developer utilities — everything runs **locally in your browser**, no data ever leaves your machine.

> Built by [karuhundeveloper.com](https://karuhundeveloper.com)

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| **Random String** | Generate secure random strings with custom length & character sets |
| **UUID Generator** | Generate RFC-compliant UUIDs v4 instantly |
| **Hash Generator & Validator** | MD5, SHA-1, SHA-256, SHA-512 hashing and comparison |
| **Bcrypt Generator** | Generate & validate Bcrypt hashes with configurable salt rounds |
| **JSON Formatter** | Beautify, minify, and validate JSON with syntax highlighting |
| **JSON ⇄ CSV** | Convert JSON arrays to CSV and back |
| **Timestamp Converter** | Convert Unix timestamps to UTC & local time, auto-detect timezone |
| **URL Encode / Decode** | Encode and decode URL strings |
| **Image Base64** | Convert images to Base64 and decode Base64 back to images |
| **Image to SVG Vector** | Convert raster images (PNG, JPG) to SVG vectors with client-side tracing |
| **Merge Images** | Stitch multiple photos together horizontally or vertically |
| **Add Watermark** | Add text or image watermarks to your photos with customizable positions |
| **Placeholder Generator** | Generate custom placeholder mock images. Export to PNG, SVG, WEBP, or Base64 |
| **Trim Image Padding** | Remove transparent or solid-color padding/whitespace from images with adjustable tolerance |
| **Crop Image** | Crop images by dragging a selection box, with aspect ratio presets and live preview |
| **Image Converter** | Convert images between JPG, PNG, WEBP, and more |
| **Video to Frames** | Extract frames, snapshots, and image sequences from video files. Export to WEBP, PNG, JPG, or download as ZIP |
| **Resize Image** | Resize images to specific pixel dimensions with aspect ratio lock |
| **Scale Image** | Scale images up or down by percentage with live size preview |
| **Grayscale Image** | Apply a black & white grayscale filter using the Luminance algorithm |
| **Remove Background** | AI-powered image background removal with WebGPU acceleration & CPU (WASM) fallback |
| **Remove Video BG** | Client-side video background removal using AI (WebGPU required) or Chroma Key (Green Screen) |
| **Text Template Editor** | Create reusable text templates with `[variable]` placeholders, saved to localStorage |
| **QR Code Generator** | Generate QR codes from text/URL with custom size & colors |
| **QR Code Reader** | Scan and decode QR codes from image uploads or live camera |
| **Barcode Generator** | Generate CODE128, EAN, UPC, and other barcodes. Download as PNG/SVG |
| **Word Counter** | Count words, characters (with/without spaces), sentences, paragraphs, lines, unique words, and estimate reading & speaking time |
| **Audio to SRT** | Generate timed subtitles from one audio file with local Whisper AI, edit the text, and download SRT |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 22.12.0
- npm

### Installation

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required due to dependency constraints between `astro@7` and `@vite-pwa/astro`.

### Development

```bash
npm run dev
```

Starts the local dev server at [http://localhost:4321](http://localhost:4321).

### Build for Production

```bash
npm run build
```

Output goes to `./dist/`.

### Preview Production Build

```bash
npm run preview
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro](https://astro.build) v7 |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |
| Reactivity | [Alpine.js](https://alpinejs.dev) v3 |
| PWA | [@vite-pwa/astro](https://vite-pwa-org.netlify.app) |
| AI (Image BG) | [@imgly/background-removal](https://img.ly/background-removal) via CDN (WebGPU + WASM fallback) |
| AI (Video BG) | WebGPU-accelerated Matting + Canvas Chroma Key + MediaRecorder (VP9 Alpha) |
| AI (Audio to SRT) | Transformers.js v4 + multilingual Whisper Tiny/Base in a Web Worker (WebGPU + WASM fallback) |
| CSV parsing | [PapaParse](https://www.papaparse.com) |
| Time | [Day.js](https://day.js.org) |
| Bcrypt | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| QR/Barcode | [qrcode](https://github.com/soldair/node-qrcode), [jsQR](https://github.com/cozmo/jsQR), [JsBarcode](https://github.com/lindell/JsBarcode) |
| ZIP Archive | [JSZip](https://stuk.github.io/jszip/) via CDN |

---

## 📁 Project Structure

```text
/
├── public/
│   └── logo.png
├── src/
│   ├── layouts/
│   │   └── Layout.astro       # Global layout: header, sidebar nav, SEO meta
│   ├── pages/
│   │   ├── index.astro        # Dashboard / tools grid
│   │   ├── random-string.astro
│   │   ├── uuid-generator.astro
│   │   ├── hash-generator.astro
│   │   ├── bcrypt-generator.astro
│   │   ├── json-formatter.astro
│   │   ├── json-csv-converter.astro
│   │   ├── timestamp-converter.astro
│   │   ├── url-encode-decode.astro
│   │   ├── image-base64.astro
│   │   ├── image-converter.astro
│   │   ├── video-to-frames.astro
│   │   ├── crop-image.astro
│   │   ├── resize-image.astro
│   │   ├── scale-image.astro
│   │   ├── grayscale-image.astro
│   │   ├── remove-bg.astro
│   │   ├── text-template.astro
│   │   ├── qr-generator.astro
│   │   ├── qr-reader.astro
│   │   ├── barcode-generator.astro
│   │   ├── word-counter.astro
│   │   ├── audio-to-srt.astro
│   │   ├── trim-image.astro
│   │   ├── image-to-svg.astro
│   │   ├── merge-images.astro
│   │   ├── add-watermark.astro
│   │   └── placeholder-generator.astro
│   ├── lib/
│   │   └── audio-to-srt.ts    # Model configuration, subtitle timings, SRT export
│   ├── scripts/
│   │   └── audio-to-srt.ts    # Audio decoding and editor state
│   ├── workers/
│   │   └── audio-to-srt.worker.ts # Local Whisper inference
│   └── styles/
│       └── global.css
├── astro.config.mjs
└── package.json
```

---

## 🔒 Privacy

All tools process data **entirely in the browser**. No files, text, or any user data is sent to any server. The Remove Background tool downloads AI model files (~10MB) directly from the library's CDN on first use, then caches them in your browser.

Audio to SRT also keeps the audio and transcript on your device. On first use, it downloads pinned public Whisper model files from Hugging Face and the ONNX runtime from its CDN; these requests do not contain your audio. Models and runtime are cached when the browser supports it. Reuse depends on the files remaining in the cache; a new model or processing backend can require another download. No transcription server, API key, or paid API is used.

### Audio to SRT

- Open `/audio-to-srt`, choose one audio file, select the model and spoken language, then transcribe. Review each subtitle segment and download `<audio-name>.srt`. Empty segments are omitted from export.
- **Whisper Tiny** is the faster default; **Whisper Base** is available for higher quality. Both are multilingual, with auto detection or manual language selection, and preserve the spoken language.
- Approximate model-file sizes (excluding runtime): Tiny **40 MB CPU / 120 MB GPU**; Base **77 MB CPU / 206 MB GPU**. Transfer sizes can vary. WebGPU and CPU use different model variants.
- Use a modern browser supporting Web Workers, Web Audio, and WebAssembly. WebGPU accelerates compatible devices; GPU failures retry through CPU/WASM. CPU mode works without production cross-origin isolation headers.
- MP3, WAV, M4A, FLAC, OGG, and other audio formats depend on your browser's codec support. Unsupported audio shows a decoding error; converting it to WAV or MP3 can help.
- Long audio is processed in overlapping chunks, but the file is decoded into memory first. Large files and slower devices need more memory and time. Cancel stops the worker; completed cached downloads are retained.
- AI subtitles may contain mistakes, especially with noise, silence, or mixed languages. Review before use. This version edits subtitle text and exports SRT; video input, translation, timing editing, and other export formats are outside its scope.
- Run `npm run test:audio-to-srt` (requires Bun) for subtitle normalization and SRT formatting tests.

---

## 📜 License

MIT — [karuhundeveloper.com](https://karuhundeveloper.com)
