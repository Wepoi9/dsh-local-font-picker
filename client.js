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
          "Local Font Access APIにはSecure Contextが必要です。"
        );
      }

      if (typeof window.queryLocalFonts !== "function") {
        throw new Error(
          "このブラウザはLocal Font Access APIに対応していません。"
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
            placeholder: "既定フォント",

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
                : "PC内フォント名を直接入力することもできます"
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
        setStatus("PC内フォントを取得しています…");

        try {
          const next = await loadLocalFonts();

          setFamilies(next);
          setStatus(`${next.length}種類のフォントを読み込みました。`);
        } catch (error) {
          if (error?.name === "NotAllowedError") {
            setStatus(
              "ローカルフォントへのアクセスが許可されませんでした。手入力は利用できます。"
            );
          } else {
            setStatus(
              `${error?.message ?? "フォント一覧を取得できませんでした。"} 手入力は利用できます。`
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
                children: "フォント"
              }),

              jsx("div", {
                style: styles.buttons,
                children: jsx("button", {
                  type: "button",
                  style: styles.button,
                  onClick: queryFonts,
                  children: "PCフォントを読み込む"
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
            label: "UIフォント",
            value: ui,
            draft: uiDraft,
            setDraft: setUiDraft,
            families,
            commit: setUi
          }),

          jsx(FontInput, {
            label: "コードフォント",
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
                children:
                  "UIプレビュー：日本語 ABC abc 0123456789"
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
                children:
                  "const deepseek = \"Harness\"; // 日本語 012345"
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
                children: "既定に戻す"
              }),

              jsx("span", {
                style: styles.hint,
                children:
                  status ||
                  "一覧取得にはブラウザの許可が必要です。フォント名の直接入力にも対応します。"
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
