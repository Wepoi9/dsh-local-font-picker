window.__ModuleLoader__.load({
  id: "dsh-local-font-picker",

  factory: (require) => {
    "use strict";

    const module = { exports: {} };
    const exports = module.exports;

    const React = require("react");
    const { jsx, jsxs } = require("react/jsx-runtime");
    const { defineStore } =
      require("@deepseek-ai/dsh-client-store");

    const PLUGIN_ID = "dsh-local-font-picker";
    const STORAGE_KEY = "dsh-local-font-picker:v1";
    const FONT_LIST_ID = "dsh-local-font-picker-list";

    // The plugin renders its own copy, so it picks a language from the browser
    // preferences instead of following the DSH Language setting. Only ja-* selects
    // Japanese; anything else, including a non-browser host, resolves to English.
    const COPY = {
      ja: {
        placeholder: "既定フォント",
        directInputHelp: "PC内フォント名を直接入力することもできます",
        fetchingFonts: "PC内フォントを取得しています…",
        loadedFonts: (count) =>
          `${count}種類のフォントを読み込みました。`,
        notAllowed:
          "ローカルフォントへのアクセスが許可されませんでした。手入力は利用できます。",
        loadFailed: "フォント一覧を取得できませんでした。",
        loadFailedSuffix: " 手入力は利用できます。",
        title: "フォント",
        loadButton: "PCフォントを読み込む",
        uiLabel: "UIフォント",
        codeLabel: "コードフォント",
        uiPreview: "UIプレビュー：日本語 ABC abc 0123456789",
        codePreview:
          'const deepseek = "Harness"; // 日本語 012345',
        resetButton: "既定に戻す",
        hint: "一覧取得にはブラウザの許可が必要です。フォント名の直接入力にも対応します。",
        secureContextRequired:
          "Local Font Access APIにはSecure Contextが必要です。",
        apiUnsupported:
          "このブラウザはLocal Font Access APIに対応していません。"
      },

      en: {
        placeholder: "Default font",
        directInputHelp:
          "You can also type a font name installed on this PC.",
        fetchingFonts: "Reading local fonts…",
        loadedFonts: (count) =>
          `${count} fonts loaded.`,
        notAllowed:
          "Local font access was not granted. Manual input still works.",
        loadFailed: "The font list could not be loaded.",
        loadFailedSuffix: " Manual input still works.",
        title: "Fonts",
        loadButton: "Load PC fonts",
        uiLabel: "UI font",
        codeLabel: "Code font",
        uiPreview:
          "UI preview: ABC abc 0123456789 日本語",
        codePreview:
          'const deepseek = "Harness"; // 日本語 012345',
        resetButton: "Reset to default",
        hint:
          "Listing fonts needs browser permission. You can also type font names directly.",
        secureContextRequired:
          "The Local Font Access API requires a secure context.",
        apiUnsupported:
          "This browser does not support the Local Font Access API."
      }
    };

    function pickCopy() {
      if (typeof window === "undefined") return COPY.en;

      try {
        const tags = [
          ...(navigator.languages ?? []),
          navigator.language
        ];

        for (const tag of tags) {
          if (typeof tag !== "string") continue;

          const primary = tag.toLowerCase().split("-")[0];

          if (primary === "ja") return COPY.ja;
          if (primary) return COPY.en;
        }
      } catch {
        // No navigator: fall back to English.
      }

      return COPY.en;
    }

    const COPY_STRINGS = pickCopy();

    const UI_FALLBACK =
      '"Yu Gothic UI", Meiryo, "Noto Sans JP", "Segoe UI", sans-serif';

    const CODE_FALLBACK =
      '"Cascadia Mono", Consolas, "BIZ UDGothic", "Yu Gothic UI", monospace';

    function cleanFamily(value) {
      if (typeof value !== "string") return "";

      return value
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, 160);
    }

    function quoteFamily(value) {
      return `"${value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')}"`;
    }

    function uiStack(family) {
      return `${quoteFamily(family)}, ${UI_FALLBACK}`;
    }

    function codeStack(family) {
      return `${quoteFamily(family)}, ${CODE_FALLBACK}`;
    }

    function same(value) {
      return {
        light: value,
        dark: value
      };
    }

    function readPrefs() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
          return { ui: "", code: "" };
        }

        const value = JSON.parse(raw);

        return {
          ui: cleanFamily(value.ui),
          code: cleanFamily(value.code)
        };
      } catch {
        return { ui: "", code: "" };
      }
    }

    function writePrefs(ui, code) {
      try {
        if (!ui && !code) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ui, code })
        );
      } catch {
        // Storage failure must not break the UI.
      }
    }

    async function loadLocalFonts() {
      if (!window.isSecureContext) {
        throw new Error(
          COPY_STRINGS.secureContextRequired
        );
      }

      if (typeof window.queryLocalFonts !== "function") {
        throw new Error(
          COPY_STRINGS.apiUnsupported
        );
      }

      const entries = await window.queryLocalFonts();
      const families = new Set();

      for (const entry of entries) {
        const family = cleanFamily(entry.family);

        if (family) {
          families.add(family);
        }
      }

      const collator = new Intl.Collator("ja", {
        sensitivity: "base",
        numeric: true
      });

      return [...families].sort(collator.compare);
    }

    // The Slot registry owns store instances; keep only the factory here so a
    // plugin reload cannot reuse a module-global handle.
    function createFontPickerStore() {
      return defineStore({
        init: () => ({
          ui: "",
          code: "",
          revision: -1
        }),

        actions: {
          sync: (draft, ui, code, revision) => {
            if (revision <= draft.revision) return;

            draft.ui = ui;
            draft.code = code;
            draft.revision = revision;
          }
        }
      });
    }

    const styles = {
      container: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px 0",
        borderBottom:
          "1px solid var(--dsw-alias-border-l2)"
      },

      header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px"
      },

      title: {
        color: "var(--dsw-alias-label-primary)",
        fontSize: "14px",
        lineHeight: "22px"
      },

      row: {
        display: "grid",
        gridTemplateColumns: "110px minmax(220px, 1fr)",
        alignItems: "center",
        gap: "10px"
      },

      label: {
        color: "var(--dsw-alias-label-secondary)",
        fontSize: "13px"
      },

      input: {
        width: "100%",
        boxSizing: "border-box",
        border:
          "1px solid var(--dsw-alias-border-l2)",
        borderRadius: "8px",
        padding: "6px 10px",
        background:
          "var(--dsw-alias-bg-module-platform)",
        color: "var(--dsw-alias-label-primary)",
        fontSize: "13px",
        lineHeight: "20px"
      },

      buttons: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap"
      },

      button: {
        border:
          "1px solid var(--dsw-alias-border-l2)",
        borderRadius: "8px",
        padding: "6px 10px",
        background:
          "var(--dsw-alias-bg-module-platform)",
        color: "var(--dsw-alias-label-primary)",
        cursor: "pointer",
        fontSize: "13px"
      },

      hint: {
        color: "var(--dsw-alias-label-tertiary)",
        fontSize: "12px",
        lineHeight: "18px"
      },

      preview: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "8px 10px",
        borderRadius: "8px",
        border:
          "1px solid var(--dsw-alias-border-l1)",
        background:
          "var(--dsw-alias-bg-module-platform)"
      }
    };

    function FontInput({
      label,
      value,
      draft,
      setDraft,
      families,
      commit
    }) {
      const known = families.includes(draft);

      return jsxs("div", {
        style: styles.row,
        children: [
          jsx("label", {
            style: styles.label,
            children: label
          }),

          jsx("input", {
            list: FONT_LIST_ID,
            value: draft,
            placeholder:
              COPY_STRINGS.placeholder,

            style: styles.input,

            onChange: (event) => {
              const next = event.currentTarget.value;
              setDraft(next);

              if (families.includes(next)) {
                commit(next);
              }
            },

            onBlur: (event) => {
              commit(event.currentTarget.value);
            },

            onKeyDown: (event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            },

            title:
              known || !draft
                ? undefined
                : COPY_STRINGS.directInputHelp
          })
        ]
      });
    }

    function FontSettingsRow({
      setUi,
      setCode,
      reset,
      useStore
    }) {
      const ui = useStore((state) => state.ui);
      const code = useStore((state) => state.code);

      const [uiDraft, setUiDraft] = React.useState(ui);
      const [codeDraft, setCodeDraft] = React.useState(code);
      const [families, setFamilies] = React.useState([]);
      const [status, setStatus] = React.useState("");

      React.useEffect(() => {
        setUiDraft(ui);
      }, [ui]);

      React.useEffect(() => {
        setCodeDraft(code);
      }, [code]);

      const queryFonts = async () => {
        setStatus(COPY_STRINGS.fetchingFonts);

        try {
          const next = await loadLocalFonts();

          setFamilies(next);
          setStatus(COPY_STRINGS.loadedFonts(next.length));
        } catch (error) {
          if (error?.name === "NotAllowedError") {
            setStatus(COPY_STRINGS.notAllowed);
          } else {
            setStatus(
              `${error?.message ?? COPY_STRINGS.loadFailed}${COPY_STRINGS.loadFailedSuffix}`
            );
          }
        }
      };

      const resetAll = () => {
        setUiDraft("");
        setCodeDraft("");
        reset();
      };

      return jsxs("div", {
        style: styles.container,

        children: [
          jsxs("div", {
            style: styles.header,
            children: [
              jsx("div", {
                style: styles.title,
                children: COPY_STRINGS.title
              }),

              jsx("div", {
                style: styles.buttons,
                children: jsx("button", {
                  type: "button",
                  style: styles.button,
                  onClick: queryFonts,
                  children: COPY_STRINGS.loadButton
                })
              })
            ]
          }),

          jsx("datalist", {
            id: FONT_LIST_ID,
            children: families.map((family) =>
              jsx(
                "option",
                { value: family },
                family
              )
            )
          }),

          jsx(FontInput, {
            label: COPY_STRINGS.uiLabel,
            value: ui,
            draft: uiDraft,
            setDraft: setUiDraft,
            families,
            commit: setUi
          }),

          jsx(FontInput, {
            label: COPY_STRINGS.codeLabel,
            value: code,
            draft: codeDraft,
            setDraft: setCodeDraft,
            families,
            commit: setCode
          }),

          jsxs("div", {
            style: styles.preview,
            children: [
              jsx("div", {
                style: {
                  fontFamily: ui
                    ? uiStack(ui)
                    : undefined,
                  fontSize: "16px",
                  lineHeight: "26px",
                  color:
                    "var(--dsw-alias-label-primary)"
                },
                children: COPY_STRINGS.uiPreview
              }),

              jsx("code", {
                style: {
                  fontFamily: code
                    ? codeStack(code)
                    : undefined,
                  fontSize: "13px",
                  lineHeight: "20px",
                  color:
                    "var(--dsw-alias-label-primary)"
                },
                children: COPY_STRINGS.codePreview
              })
            ]
          }),

          jsxs("div", {
            style: styles.buttons,
            children: [
              jsx("button", {
                type: "button",
                style: styles.button,
                onClick: resetAll,
                children: COPY_STRINGS.resetButton
              }),

              jsx("span", {
                style: styles.hint,
                children: status || COPY_STRINGS.hint
              })
            ]
          })
        ]
      });
    }

    const inject = [
      "slots",
      "theme"
    ];

    function apply(ctx) {
      const fontPickerStore = createFontPickerStore();
      let prefs = readPrefs();
      let revision = 0;
      let bound;
      let releaseOverride = () => {};

      const sync = () => {
        revision += 1;
        bound?.sync(
          prefs.ui,
          prefs.code,
          revision
        );
      };

      const applyOverride = () => {
        const tokens = {};

        if (prefs.ui) {
          tokens["--dsw-font-family"] =
            same(uiStack(prefs.ui));
        }

        if (prefs.code) {
          const stack = codeStack(prefs.code);

          tokens["--ds-font-family-code"] =
            same(stack);

          tokens["--dsw-font-mono"] =
            same(stack);
        }

        const nextRelease =
          Object.keys(tokens).length > 0
            ? ctx.theme.overrideTokens(
                PLUGIN_ID,
                tokens
              )
            : () => {};

        releaseOverride();
        releaseOverride = nextRelease;
      };

      const update = (field, value) => {
        const family = cleanFamily(value);

        prefs = {
          ...prefs,
          [field]: family
        };

        writePrefs(prefs.ui, prefs.code);
        applyOverride();
        sync();
      };

      ctx.effect(() => {
        applyOverride();

        return () => {
          releaseOverride();
        };
      }, "dsh-local-font-picker: theme override");

      ctx.slots.inject(
        "settings.general.item",
        () =>
          ctx.slots.register(
            {
              name: "settings.general.item",
              id: PLUGIN_ID,
              order: 30,
              store: fontPickerStore,

              inject: (actions) => {
                bound = actions;
                sync();

                return {
                  setUi: (value) =>
                    update("ui", value),

                  setCode: (value) =>
                    update("code", value),

                  reset: () => {
                    prefs = {
                      ui: "",
                      code: ""
                    };

                    writePrefs("", "");
                    applyOverride();
                    sync();
                  }
                };
              }
            },

            FontSettingsRow
          )
      );
    }

    exports.inject = inject;
    exports.apply = apply;

    return module.exports;
  }
});
