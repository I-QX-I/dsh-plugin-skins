When the user supplies a release URL, download its glass-skins.zip and the same release SHA256SUMS.txt, verify the ZIP hash, then follow this guide. Use release assets, not GitHub source archives; no source rebuild. Respect network and permission restrictions. Report any block and offer attachment installation instead of changing permissions or proxies.

# Install the attached Glass Skins plugin

Made by 爱伦提卡. Once the user requests installation, complete this flow without asking them to extract files, choose an installation channel, change presets or type commands. Preserve the active profile, permissions, existing preferences and unrelated plugins/accounts/models/chats.

1. For ZIP, extract only the root guide, INSTALL.mjs, INSTALLER.mjs and plugin.tgz into a temporary directory. For TGZ, inspect package.json and this guide, and extract package/INSTALLER.mjs. Do not research or rebuild client source.
2. Use the host’s existing Node to run ZIP’s INSTALL.mjs with no extra arguments, or INSTALLER.mjs <real TGZ path>. Pass paths as separate arguments; retain spaces, Unicode and apostrophes. The helper validates/stages only. Read its spec; installed:false is not installation success.
3. Select the channel automatically: use plugin_manager/install_bundle if present; otherwise use the official host CLI, `dsh plugin --profile <current-profile> add <spec>`. A missing agent tool is a normal CLI fallback; do not ask the user to switch to Creator or enable tools. Use the supplied CLI/runtime and, only if needed, its --help. Do not download global CLI/developer tools or guess/change profiles. Stop only if both routes are unavailable or the host requires permission approval.
4. Wait for completion and verify bundle selection, loading and Settings → Skins. Report restart-required accurately. Use official host management logic for installation, activation and rollback, never manual profile edits or a bare pnpm add.
5. Keep the final reply short: installed/not installed, restart requirement, and settings location. Do not expose implementation steps, impose a test checklist or offer unrelated profile installations unless requested.

Expected identity: dsh-plugin-skins / author 爱伦提卡 / dsh.bundle.patch ./cordis.patch.yml. Install only from the helper’s stable cache spec, never the original download, temporary extraction, developer link or creator’s path. The original ZIP/TGZ can move or be deleted afterward; keep managed cache files while referenced by the profile.

The three MIT dependencies are bundled. No client rebuild or dependency download is needed for this plugin; other profile operations may affect total time. Integrity hashes are not digital signatures. Fresh installs use the creator’s Aero liquid preset; explicit existing choices remain. The plugin stays independent, switchable and removable through the host manager.

The agent tool is enabled by default in Creator, while the official CLI shares management operations: [official documentation](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md). Attaching a file alone does not execute code; the host AI performs the flow after the user requests installation.
