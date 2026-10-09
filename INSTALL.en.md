> Public release: [v2.6.3](https://github.com/I-QX-I/dsh-plugin-skins/releases/tag/v2.6.3).

# Installation and maintenance

[中文](INSTALL.md) · [Quick AI installation](AI-INSTALL.en.md) · [Credits](CREDITS.md)

Drag the release ZIP into DeepSeek Harness and say “Install this plugin”. No manual extraction or commands are required. Its AI automatically uses the session installation tool or official host CLI without changing presets. The helper validates the archive and stages it in a stable content-addressed cache; the host plugin manager installs and enables that source. The downloaded original can then be moved, renamed or deleted. Older archives do not contain this improved flow.

Settings → Skins controls appearance. New installations use the creator’s Aero liquid glass preset. Existing twelve-field preferences are preserved. Plugin display metadata has Chinese and English names; its technical package/entry identifiers remain `dsh-plugin-skins`/`skins` for upgrades and preferences.

Install, update, disable and uninstall through the host manager. Do not manually edit profiles or replace host application files. Disabling/unloading releases plugin-owned styles, background elements, optical maps, observers, event listeners and timers. Cached installation archives intentionally remain as stable reinstall sources; do not remove one while a profile references it.

The three required schema packages are included in prepared releases with their MIT licenses and exact versions in DEPENDENCIES.json. No admin privileges, development tools, remote fonts or material services are required. AI tool permissions still follow the host's rules. Other profile dependencies can affect installation time or network needs.

Capability-based fallbacks cover older media-query listeners and missing optional browser APIs. Reduced motion/transparency and stronger contrast settings are respected. Chromium/DPR simulations and the tested Windows host cannot certify all physical GPUs, operating systems, remote sessions or future Harness versions; rerun the host contract checks after upgrades.

For release preparation, run `npm run build:check`, the relevant checks, then `npm run release:stage -- --out=<separate empty directory>`. Package only that prepared directory, not the development checkout. The staging process copies actual dependency files rather than machine-specific links. Formal packaging and release are separate steps from validation archives.

开发 / Development: `npm run release -- --out=../release`。公开 Releases 的 ZIP 是给用户的安装包，GitHub Source code ZIP 是开发源码。
