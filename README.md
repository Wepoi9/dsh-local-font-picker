# dsh-local-font-picker

English | [日本語](README.ja.md)

A community plugin for the DeepSeek Harness (DSH) Web UI that lets you choose installed local fonts for the interface and code surfaces.

> This is a community-maintained plugin, not part of the DeepSeek Harness core distribution.

## What it does

- Lists locally installed fonts through the Local Font Access API (`window.queryLocalFonts()`).
- Applies separate UI and code font choices through DSH Theme and Slot APIs.
- Stores only the selected font family names in browser `localStorage`.
- Falls back to manual font-name entry when the Local Font Access API is unavailable.
- Requires no changes to the DSH source tree and no plugin build step.

The host entry (`index.js`) is intentionally a no-op. All behavior runs in the Web client.

## Compatibility

Latest tested DSH version: **0.2.1-alpha.1**.

| DSH version | Verification |
| --- | --- |
| 0.1.6-alpha.2 | Slot/Theme contract compatibility, unload/reload cleanup, and saved-setting restore verified |
| 0.1.7-alpha.2 | Plugin load, inventory visibility, and font application verified |
| 0.1.7-rc.1 | Plugin load, inventory visibility, and font application verified |
| 0.1.7-rc.2 | Plugin load, inventory visibility, and font application verified |
| 0.2.0-rc.1 | Plugin load, inventory visibility, and font application verified |
| 0.2.0-rc.2 | Plugin load, inventory visibility, and font application verified |
| 0.2.1-alpha.1 | Plugin load, inventory visibility, and font application verified; E2E re-verified against current main 566a1b7 on 2026-10-07: clean plugin load, Settings rows visible, zero console errors, local-font permission granted then 107 PC fonts listed, UI and code fonts applied and restored after reload, and reset to defaults verified |

Newer DSH versions are not assumed compatible until verified.

## Install

Add a local checkout of this repository to the target DSH profile:

```sh
dsh plugin --profile web add <absolute-path-to-this-repository>
```

Restart DSH Web after installation.

## Usage

Open **Settings → General → Fonts**.

- Use **Load PC fonts** to request access to the browser's local font list.
- Select or type an installed font family for the UI font and code font.
- Use **Reset to default** to remove the overrides and stored selections.

Button and status labels follow the copy language described above: the English list shows **Load PC fonts**, Japanese shows **PCフォントを読み込む**, and the same applies to the rest of the row.

Copy language follows the browser's preferred languages, not the DSH Language setting. The first usable preference decides: `ja` renders Japanese, anything else renders English.

## Privacy and permissions

Using **Load PC fonts** invokes the browser Local Font Access API and may show a permission prompt. The browser can expose installed font metadata to this page after permission is granted.

This plugin:

- does not read or copy font files;
- does not upload font data;
- does not make network requests;
- stores only the selected font family names in `localStorage`, scoped to the current browser origin.

## Limitations

- Local Font Access is primarily available in Chromium-based desktop browsers. Other browsers can still use manual font-name entry.
- Settings are stored per browser origin.
- DSH is still evolving rapidly, so client extension contracts can change between prerelease versions.
- The copy language is decided once when the row module loads. Changing the browser's preferred languages takes effect on the next page reload.

## Check

```sh
npm run check
```

## Contributing

Bug reports and focused pull requests are welcome. Please include the DSH version, browser, operating system, reproduction steps, and expected/actual behavior when reporting a compatibility issue.

## License

MIT. See [LICENSE](LICENSE).
