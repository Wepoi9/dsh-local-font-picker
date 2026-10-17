# dsh-local-font-picker

English | [日本語](README.ja.md)

A community plugin for the DeepSeek Harness (DSH) Web UI that lets you choose installed local fonts for the interface and code surfaces.

> This is a community-maintained plugin, not part of the DeepSeek Harness core distribution.

## What it does

- Lists locally installed fonts through the Local Font Access API (`window.queryLocalFonts()`).
- Applies the selected UI and code fonts through the built-in DSH Theme API (`ctx.theme.setFontFamily(role, value)`); persistence, CSS application, and reload restore belong to the DSH core settings.
- Keeps no settings of its own — no `localStorage`, no Theme token overrides. The built-in font settings and this plugin row always read and write the same core state.
- Falls back to manual font-name entry when the Local Font Access API is unavailable.
- Requires no changes to the DSH source tree and no plugin build step.

The host entry (`index.js`) is intentionally a no-op. All behavior runs in the Web client.

## Compatibility

Since **0.3.0** this plugin delegates font state to the DSH core (`ctx.theme.setFontFamily`); it stores nothing of its own. Earlier plugin releases kept their own copy in `localStorage` plus Theme token overrides. The table records runtime verification per listed state; rows up to 0.2.1-alpha.1 were recorded on the pre-0.3.0 mechanism.

Latest DSH version with recorded runtime verification: **0.2.1-rc.2**, runtime-verified against the live app on 2026-10-17.

| DSH version | Verification |
| --- | --- |
| 0.1.6-alpha.2 | Slot/Theme contract compatibility, unload/reload cleanup, and saved-setting restore verified |
| 0.1.7-alpha.2 | Plugin load, inventory visibility, and font application verified |
| 0.1.7-rc.1 | Plugin load, inventory visibility, and font application verified |
| 0.1.7-rc.2 | Plugin load, inventory visibility, and font application verified |
| 0.2.0-rc.1 | Plugin load, inventory visibility, and font application verified |
| 0.2.0-rc.2 | Plugin load, inventory visibility, and font application verified |
| 0.2.1-alpha.1 | Plugin load, inventory visibility, and font application verified; E2E re-verified against current main 566a1b7 on 2026-10-07: clean plugin load, Settings rows visible, zero console errors, local-font permission granted then 107 PC fonts listed, UI and code fonts applied and restored after reload, and reset to defaults verified |
| 0.2.1-alpha.2 | `engines.dsh` requires the core font-family settings added in this version; core-delegation behavior has **not** been runtime-verified on this version |
| 0.2.1-alpha.3 | 0.3.0 core-delegation behavior verified: plugin load, font settings rows, core apply, persistence across reload, and defaults restore |
| 0.2.1-rc.1 | Covered by the existing `engines.dsh` range (no manifest change); `npm run check` passing on 2026-10-17; the 0.3.0 core-delegation behavior re-verified on the live web UI the same day: plugin load, settings rows, 107 PC fonts listed under a granted Local Font Access permission, UI and code font application with restore after reload, reset to defaults, zero page errors; stored-and-echoed code-font values carry the quotes the DSH core ui-theme setting keeps |
| 0.2.1-rc.2 | Covered by the existing `engines.dsh` range (no manifest change); `npm run check` passing on 2026-10-17; the 0.3.0 core-delegation behavior re-verified on the live web UI the same day: plugin load, settings rows, 107 PC fonts listed under a granted Local Font Access permission, UI font `"Meiryo UI"` and code font `"Consolas"` applied with restore after reload, reset to defaults, zero page errors |

DSH **0.2.1-alpha.2** added built-in font-family settings. Since 0.3.0 this plugin writes exactly those core settings, so no competing plugin-side state remains; earlier plugin releases (0.1.x–0.2.x) kept their own overrides in parallel and were never verified against the built-in settings. Upgrading from a pre-0.3.0 release does not migrate the old copy automatically: the plugin stops reading its `localStorage` state and no longer installs Theme token overrides, so fonts show whatever the core font settings hold (the defaults after a clean upgrade) until you select a font family once in the settings row. The browser-stored entry older releases left behind is no longer read; removing it is optional and changes nothing else. Other newer DSH versions are not assumed compatible until verified.

## Install

Add a local checkout of this repository to the target DSH profile:

```sh
dsh plugin --profile web add <absolute-path-to-this-repository>
```

Restart DSH Web after installation.

## Usage

Open **Settings → General → Fonts**.

- Use **Load PC fonts** to request access to the browser's local font list.
- Select or type an installed font family for the UI font and code font; the value is written to the DSH built-in font settings and stays in sync with the built-in font rows.
- Use **Reset to default** to hand both roles back to the built-in font list.

Button and status labels follow the copy language described above: the English list shows **Load PC fonts**, Japanese shows **PCフォントを読み込む**, and the same applies to the rest of the row.

Copy language follows the browser's preferred languages, not the DSH Language setting. The first usable preference decides: `ja` renders Japanese, anything else renders English.

## Privacy and permissions

Using **Load PC fonts** invokes the browser Local Font Access API and may show a permission prompt. The browser can expose installed font metadata to this page after permission is granted.

This plugin:

- does not read or copy font files;
- does not upload font data;
- does not make network requests;
- stores no settings of its own — selected font family names are persisted by the DSH core settings, not by plugin-managed `localStorage`.

## Limitations

- Local Font Access is primarily available in Chromium-based desktop browsers. Other browsers can still use manual font-name entry.
- Font settings live in the DSH core settings and are shared with the built-in font rows; this plugin adds no separate storage.
- Requires DSH **0.2.1-alpha.2** or newer — the core font-family settings the plugin delegates to were added there.
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
