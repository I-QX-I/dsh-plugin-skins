# Installation and use

[中文](INSTALL.md) · [Download the latest release](https://github.com/I-QX-I/dsh-plugin-skins/releases/latest)

Download `glass-skins.zip`, attach it to a DeepSeek Harness conversation and say “Install this plugin.” No manual extraction or commands are needed. The assistant uses the conversation's installation tool, or the host's official CLI if that tool is unavailable.

Fresh installs use Aero liquid glass; upgrades preserve your preferences. Once installed, the original download can be moved, renamed or deleted. Keep the host-managed installation cache.

## Using the plugin

Open **Settings → Skins**, enable the skin and choose a theme and material. Opacity, lighting, background speed, color separation, highlights and refraction thickness can be adjusted independently.

Pure transparency is experimental. Try Crystal or Clear if the background makes text hard to read. Long inputs and messages use lightweight glass. System reduced motion, reduced transparency and stronger contrast settings are supported.

Turn off the skin switch to restore the host appearance. Use the host plugin manager to update, disable or uninstall.

## Common questions

- **No Skins entry?** Check the plugin's loading status. Restart normally if the host asks you to.
- **Can I move the downloaded file?** Yes. A normal installation uses a separate managed cache.
- **Do I need developer tools?** No. Release packages include the required dependencies and need no compilation or extra services.
- **Will it look identical on every computer?** GPU, display scale and host version can affect rendering. See [Compatibility](docs/COMPATIBILITY.md).

Use the ZIP attached to the GitHub Release for installation. Source code ZIP is for development. A development `link:` mount depends on the source directory staying in place.
