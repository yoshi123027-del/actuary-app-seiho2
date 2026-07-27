# Vercel版（生保2）

既存のStreamlit版を残したまま、静的配信できるNext.js版を `vercel/` に追加しています。

## ローカル確認

```bash
cd vercel
npm install
npm run dev
```

## Vercel設定

- Framework Preset: Next.js
- Root Directory: `vercel`
- Build Command: `npm run build`
- Output Directory: `out`

GitHubの `main` ブランチへ反映されると、同じVercel URLへ自動デプロイできます。`shoken.csv` はビルド時に `vercel/public/shoken.json` へ自動変換されるため、CSVを更新すれば「所見で学ぶ」に反映されます。

学習履歴・自己評価・復習フラグはブラウザのlocalStorageに保存されます。

「所見で学ぶ」では2018〜2025年度の原文問題に加え、各問について次を表示します。

- 目的 → 変化 → 影響 → 計測 → 経営対応による論点整理
- 問題文の小問・指定観点の順序に沿った合格レベル答案
- 答案各部分とフレームワークとの対応表示

<!-- vercel-redeploy-20260728-framework-answer -->
