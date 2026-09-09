# dsh-local-font-picker

DeepSeek Harness（DSH）Web UI 用のクライアント専用プラグイン（DSH `0.1.2-alpha.2` で動作確認済み。後続バージョンは互換性未保証。`@deepseek-ai/dsh-client-store` ベースの Slot store 契約を使用）。
PC にインストール済みのフォントを `window.queryLocalFonts()`（Local Font Access API）で列挙し、UI フォントとコードフォントを DSH の公式 Theme API / Slot API で変更します。

- DSH 本体の改変なし（静的プラグイン、ビルド不要）
- Host 側コードは no-op（`index.js`）
- 選定したフォント名だけを `localStorage` に保存（フォントファイルの読み込み・複製は行わない）
- 一覧 API が使えないブラウザではフォント名の直接入力で同様に機能する

## 動作

- 設定UI：`Settings → General → フォント`
- 「PCフォントを読み込む」でローカルフォント一覧を取得（初回はブラウザのアクセス確認が表示されます）
- 選択したフォントは `ctx.theme.overrideTokens()` によるトークン上書き（`--dsw-font-family` / `--ds-font-family-code` / `--dsw-font-mono`）で即時反映
- 「既定に戻す」で上書きを解除し、保存も削除する

## 導入

プラグインディレクトリを DSH profile に追加します（ローカルディレクトリ形式）：

```
dsh plugin --profile web add <プラグインディレクトリのパス>
```

その後 DSH Web を再起動します（`dsh --profile web --host 127.0.0.1 --port 3080`）。

## 確認

```
node --check index.js && node --check client.js
```

## 制約

- Local Font Access API は Chrome / Edge デスクトップ向け（Baseline 未達）。Firefox 等では直接入力モードになります
- 設定はブラウザの origin ごとに別管理（`localStorage`）

## ライセンス

MIT License。詳細は [LICENSE](LICENSE) を参照してください。
