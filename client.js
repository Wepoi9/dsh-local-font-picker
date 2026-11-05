window.__ModuleLoader__.load({
  id: 'dsh-local-font-picker',

  factory(require) {
    const React = require('react')
    const { jsx, jsxs } = require('react/jsx-runtime')
    const { defineStore } = require('@deepseek-ai/dsh-client-store')

    const PLUGIN_ID = 'dsh-local-font-picker'
    const FONT_LIST_ID = 'dsh-local-font-picker-list'

    // The plugin renders its own copy, so it picks a language from the browser
    // preferences instead of following the DSH Language setting. Only a `ja`
    // primary subtag selects Japanese; anything else, including a non-browser
    // host, resolves to English.
    const COPY = {
      ja: {
        placeholder: '既定フォント',
        directInputHelp: 'PC内のフォント名を直接入力することもできます',
        fetchingFonts: 'PC内のフォントを取得しています…',
        loadedFonts: count => `${count}種類のフォントを読み込みました。`,
        notAllowed: 'ローカルフォントへのアクセスが許可されませんでした。手入力は利用できます。',
        loadFailed: 'フォント一覧を取得できませんでした。',
        loadFailedSuffix: ' 手入力は利用できます。',
        title: 'フォント',
        loadButton: 'PCフォントを読み込む',
        uiLabel: 'UIフォント',
        codeLabel: 'コードフォント',
        uiPreview: 'UIプレビュー：日本語 ABC abc 0123456789',
        codePreview: 'const deepseek = "Harness"; // 日本語 012345',
        resetButton: '既定に戻す',
        hint: 'フォント一覧の取得にはブラウザの許可が必要です。フォント名を直接入力することもできます。',
        secureContextRequired: 'Local Font Access APIにはSecure Contextが必要です。',
        apiUnsupported: 'このブラウザはLocal Font Access APIに対応していません。',
      },
      en: {
        placeholder: 'Default font',
        directInputHelp: 'You can also type a font name installed on this PC.',
        fetchingFonts: 'Reading local fonts…',
        loadedFonts: count => `${count} fonts loaded.`,
        notAllowed: 'Local font access was not granted. Manual input still works.',
        loadFailed: 'The font list could not be loaded.',
        loadFailedSuffix: ' Manual input still works.',
        title: 'Fonts',
        loadButton: 'Load PC fonts',
        uiLabel: 'UI font',
        codeLabel: 'Code font',
        uiPreview: 'UI preview: ABC abc 0123456789 日本語',
        codePreview: 'const deepseek = "Harness"; // 日本語 012345',
        resetButton: 'Reset to default',
        hint: 'Listing fonts needs browser permission. You can also type font names directly.',
        secureContextRequired: 'The Local Font Access API requires a secure context.',
        apiUnsupported: 'This browser does not support the Local Font Access API.',
      },
    }

    /**
     * Pick the copy language from the browser's ordered language tags; the first
     * usable preference decides, matching the DSH locale resolver.
     * @returns the copy dictionary to render with.
     */
    function pickCopy() {
      if (typeof window === 'undefined') return COPY.en
      try {
        for (const tag of [...(navigator.languages ?? []), navigator.language]) {
          if (typeof tag !== 'string') continue
          const primary = tag.toLowerCase().split('-')[0]
          if (!primary) continue
          return primary === 'ja' ? COPY.ja : COPY.en
        }
      } catch {
        // No navigator: English.
      }
      return COPY.en
    }

    const STRINGS = pickCopy()

    /**
     * Normalize one font family name for the datalist and the Theme API.
     * @param value - the raw `FontFace.family` value or typed text.
     * @returns the name without control characters, capped at 160 characters.
     */
    function cleanFamily(value) {
      if (typeof value !== 'string') return ''
      return value.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 160)
    }

    /**
     * Read the distinct family names installed on this machine.
     * @returns the names sorted for display.
     * @throws when the context is not secure, the API is absent, or permission is refused.
     */
    async function loadLocalFonts() {
      if (!window.isSecureContext) throw new Error(STRINGS.secureContextRequired)
      if (typeof window.queryLocalFonts !== 'function') throw new Error(STRINGS.apiUnsupported)

      const families = new Set()
      for (const entry of await window.queryLocalFonts()) {
        const family = cleanFamily(entry.family)
        if (family) families.add(family)
      }
      const collator = new Intl.Collator('ja', { sensitivity: 'base', numeric: true })
      return [...families].sort(collator.compare)
    }

    // The slot registry owns store instances, so only the factory is kept here:
    // a plugin reload must not reuse a module-global handle.
    function createFontPickerStore() {
      return defineStore({
        init: () => ({ ui: '', code: '', revision: -1 }),
        actions: {
          sync: (draft, ui, code, revision) => {
            if (revision <= draft.revision) return
            draft.ui = ui
            draft.code = code
            draft.revision = revision
          },
        },
      })
    }

    const styles = {
      container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px 0',
        borderBottom: '1px solid var(--dsw-alias-border-l2)',
      },
      header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
      title: { color: 'var(--dsw-alias-label-primary)', fontSize: '14px', lineHeight: '22px' },
      row: {
        display: 'grid',
        gridTemplateColumns: '110px minmax(220px, 1fr)',
        alignItems: 'center',
        gap: '10px',
      },
      label: { color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' },
      input: {
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: '8px',
        padding: '6px 10px',
        background: 'var(--dsw-alias-bg-module-platform)',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: '13px',
        lineHeight: '20px',
      },
      buttons: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
      button: {
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: '8px',
        padding: '6px 10px',
        background: 'var(--dsw-alias-bg-module-platform)',
        color: 'var(--dsw-alias-label-primary)',
        cursor: 'pointer',
        fontSize: '13px',
      },
      hint: { color: 'var(--dsw-alias-label-tertiary)', fontSize: '12px', lineHeight: '18px' },
      preview: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px 10px',
        borderRadius: '8px',
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-module-platform)',
      },
    }

    /** One font-name field: free text plus the local-family datalist. */
    function FontInput({ label, draft, setDraft, families, commit }) {
      const known = families.includes(draft)
      return jsxs('div', {
        style: styles.row,
        children: [
          jsx('label', { style: styles.label, children: label }),
          jsx('input', {
            list: FONT_LIST_ID,
            value: draft,
            placeholder: STRINGS.placeholder,
            style: styles.input,
            onChange: event => {
              const next = event.currentTarget.value
              setDraft(next)
              // A datalist selection is a commit; typing alone waits for blur or Enter.
              if (families.includes(next)) commit(next)
            },
            onBlur: event => commit(event.currentTarget.value),
            onKeyDown: event => {
              if (event.key === 'Enter') event.currentTarget.blur()
            },
            title: known || !draft ? undefined : STRINGS.directInputHelp,
          }),
        ],
      })
    }

    /** The settings row: two role fields, local enumeration, previews, and reset. */
    function FontSettingsRow({ setUi, setCode, reset, useStore }) {
      const ui = useStore(state => state.ui)
      const code = useStore(state => state.code)
      const [uiDraft, setUiDraft] = React.useState(ui)
      const [codeDraft, setCodeDraft] = React.useState(code)
      const [families, setFamilies] = React.useState([])
      const [status, setStatus] = React.useState('')

      React.useEffect(() => setUiDraft(ui), [ui])
      React.useEffect(() => setCodeDraft(code), [code])

      const queryFonts = async () => {
        setStatus(STRINGS.fetchingFonts)
        try {
          const next = await loadLocalFonts()
          setFamilies(next)
          setStatus(STRINGS.loadedFonts(next.length))
        } catch (error) {
          if (error?.name === 'NotAllowedError') {
            setStatus(STRINGS.notAllowed)
          } else {
            setStatus(`${error?.message ?? STRINGS.loadFailed}${STRINGS.loadFailedSuffix}`)
          }
        }
      }

      const resetAll = () => {
        setUiDraft('')
        setCodeDraft('')
        reset()
      }

      return jsxs('div', {
        style: styles.container,
        children: [
          jsxs('div', {
            style: styles.header,
            children: [
              jsx('div', { style: styles.title, children: STRINGS.title }),
              jsx('div', {
                style: styles.buttons,
                children: jsx('button', {
                  type: 'button',
                  style: styles.button,
                  onClick: queryFonts,
                  children: STRINGS.loadButton,
                }),
              }),
            ],
          }),
          jsx('datalist', {
            id: FONT_LIST_ID,
            children: families.map(family => jsx('option', { value: family }, family)),
          }),
          jsx(FontInput, {
            label: STRINGS.uiLabel,
            draft: uiDraft,
            setDraft: setUiDraft,
            families,
            commit: setUi,
          }),
          jsx(FontInput, {
            label: STRINGS.codeLabel,
            draft: codeDraft,
            setDraft: setCodeDraft,
            families,
            commit: setCode,
          }),
          jsxs('div', {
            style: styles.preview,
            children: [
              jsx('div', {
                style: {
                  fontFamily: ui || undefined,
                  fontSize: '16px',
                  lineHeight: '26px',
                  color: 'var(--dsw-alias-label-primary)',
                },
                children: STRINGS.uiPreview,
              }),
              jsx('code', {
                style: {
                  fontFamily: code || undefined,
                  fontSize: '13px',
                  lineHeight: '20px',
                  color: 'var(--dsw-alias-label-primary)',
                },
                children: STRINGS.codePreview,
              }),
            ],
          }),
          jsxs('div', {
            style: styles.buttons,
            children: [
              jsx('button', {
                type: 'button',
                style: styles.button,
                onClick: resetAll,
                children: STRINGS.resetButton,
              }),
              jsx('span', { style: styles.hint, children: status || STRINGS.hint }),
            ],
          }),
        ],
      })
    }

    return {
      inject: ['slots', 'theme'],

      apply(ctx) {
        const theme = ctx.theme
        const fontPickerStore = createFontPickerStore()
        let bound

        // The core owns font state; mirroring its snapshot keeps this row and
        // the built-in font settings from drifting apart.
        const sync = snapshot => bound?.sync(snapshot.fontFamilies.text, snapshot.fontFamilies.code, snapshot.revision)

        ctx.on('theme/change', sync)

        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: PLUGIN_ID,
              order: 30,
              store: fontPickerStore,

              inject: actions => {
                bound = actions
                sync(theme.getTheme())
                return {
                  setUi: value => theme.setFontFamily('text', value),
                  setCode: value => theme.setFontFamily('code', value),
                  reset: () => {
                    theme.setFontFamily('text', '')
                    theme.setFontFamily('code', '')
                  },
                }
              },
            },
            FontSettingsRow,
          )
        )
      },
    }
  },
})
