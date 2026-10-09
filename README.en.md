# Glass Skins · 玻璃皮肤

**An independent DeepSeek Harness glass skin plugin, made by 爱伦提卡.**

[中文](README.md) · [Download](https://github.com/I-QX-I/dsh-plugin-skins/releases/latest) · [Trailer](https://github.com/I-QX-I/dsh-plugin-skins/releases/download/v2.6.3/glass-skins-promo.mp4) · [Credits](CREDITS.md)

![Glass Skins](docs/assets/cover.jpg)

## Install with one chat request

Paste this line into a **DeepSeek Harness conversation**, then send:

```text
Install and enable Glass Skins by 爱伦提卡 from https://github.com/I-QX-I/dsh-plugin-skins/releases/download/v2.6.3/glass-skins.zip; follow the bundled AI-INSTALL.en.md, use the current profile and preserve existing preferences.
```

This is an AI installation request, not a shell command. The assistant downloads and verifies the ZIP, then uses the host plugin manager or official CLI, subject to host permissions. If downloading is unavailable, attach the [ZIP](https://github.com/I-QX-I/dsh-plugin-skins/releases/download/v2.6.3/glass-skins.zip) and ask to install. No source build or manual extraction is required. Open **Settings → Skins** afterward. The downloaded original can be moved or deleted; keep the managed installation cache.

## Features

Nine palettes; liquid and frosted glass; independent rim highlight and refraction thickness; adjustable gradient flow, planar light drift, color separation, opacity and lighting. Long text uses lightweight reading glass. English/Chinese, host light/dark appearance, reduced motion and capability fallbacks are supported. Preferences persist. Disable or uninstall through the host manager.

![Themes](docs/assets/themes.jpg)

Aero · Aurora · Graphite · Phoenix · Jade · Flame · Teal · Rose Quartz · Amber.

## Compatibility

Visually and operationally tested primarily on Windows Electron/Chromium Harness. macOS/Linux have not received real-device visual acceptance. CI does not establish GPU or future host compatibility. Fine corner strokes may show pixel discontinuities at some DPRs. Pure transparency is experimental and may expose overlapping background text. Web materials approximate glass; no universal full-frame-rate guarantee.

The plugin does not patch the host executable or change accounts, models, chat data or other plugins. [Compatibility](docs/COMPATIBILITY.md) · [Device checklist](TEST-OTHER-DEVICE.md).

## Development

Node.js 22+:

```sh
npm ci
npm run build
npm test
npm run release -- --out=../glass-skins-release
```

Edit `src/client/`, then build the generated `client.js`. Public tests cover reproducible builds, defaults, preference persistence/stale echoes/migration, bilingual credits and installation cache integrity. Historic local 37-check browser suites rely on private host snapshots and are not presented as portable CI. Real-device visual and performance checks remain essential.

[验证摘要 / Validation](docs/VALIDATION.md) · [Architecture](docs/ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md).

## License and credits

Copyright © 2026 爱伦提卡. [MIT License](LICENSE); retain its copyright and permission notices when redistributing. AI development tools: DeepSeek Harness AI and OpenAI Codex. See [Credits](CREDITS.md), [Notice](NOTICE.md) and [46 research references](docs/SOURCES.md) for roles, third-party licenses and research attribution. Releases vendor three MIT dependencies with upstream notices. This is not an official DeepSeek or Apple product. No user conversations, private host files, reference-game assets or research source snapshots are distributed.

[显性及隐性制作者标记 / Visible and non-UI creator marks](WATERMARKS.md)

Use, modify and redistribute freely. When distributing copies or derivatives, retain the creator copyright, original-project URL and permission notice in LICENSE. No extra mandatory UI display condition is added.
