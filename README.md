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
| **Trim Image Padding** | Remove transparent or solid-color padding/whitespace from images with adjustable tolerance |
| **Image Converter** | Convert images between JPG, PNG, WEBP, and more |
| **Resize Image** | Resize images to specific pixel dimensions with aspect ratio lock |
| **Scale Image** | Scale images up or down by percentage with live size preview |
| **Grayscale Image** | Apply a black & white grayscale filter using the Luminance algorithm |
| **Remove Background** | AI-powered background removal using ONNX in-browser (no upload) |
| **Text Template Editor** | Create reusable text templates with `[variable]` placeholders, saved to localStorage |
| **QR Code Generator** | Generate QR codes from text/URL with custom size & colors |
| **QR Code Reader** | Scan and decode QR codes from image uploads or live camera |
| **Barcode Generator** | Generate CODE128, EAN, UPC, and other barcodes. Download as PNG/SVG |
| **Word Counter** | Count words, characters (with/without spaces), sentences, paragraphs, lines, unique words, and estimate reading & speaking time |

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
| AI (Remove BG) | [@imgly/background-removal](https://img.ly/background-removal) via CDN |
| CSV parsing | [PapaParse](https://www.papaparse.com) |
| Time | [Day.js](https://day.js.org) |
| Bcrypt | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| QR/Barcode | [qrcode](https://github.com/soldair/node-qrcode), [jsQR](https://github.com/cozmo/jsQR), [JsBarcode](https://github.com/lindell/JsBarcode) |

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
│   │   ├── resize-image.astro
│   │   ├── scale-image.astro
│   │   ├── grayscale-image.astro
│   │   ├── remove-bg.astro
│   │   ├── text-template.astro
│   │   ├── qr-generator.astro
│   │   ├── qr-reader.astro
│   │   ├── barcode-generator.astro
│   │   ├── word-counter.astro
│   │   ├── trim-image.astro
│   │   └── image-to-svg.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
└── package.json
```

---

## 🔒 Privacy

All tools process data **entirely in the browser**. No files, text, or any user data is sent to any server. The Remove Background tool downloads AI model files (~10MB) directly from the library's CDN on first use, then caches them in your browser.

---

## 📜 License

MIT — [karuhundeveloper.com](https://karuhundeveloper.com)
