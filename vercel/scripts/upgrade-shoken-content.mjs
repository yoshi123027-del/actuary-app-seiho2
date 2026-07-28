import fs from "node:fs";

const pagePath = new URL("../app/page.js", import.meta.url);
const answerViewPath = new URL("../app/ShokenAnswerViewEnhanced.js", import.meta.url);
let source = fs.readFileSync(pagePath, "utf8");
const original = source;

const configImport = 'import { appConfig } from "./config";';
const answerImport = 'import ShokenAnswerView from "./ShokenAnswerView";';

if (!source.includes(answerImport)) {
  if (!source.includes(configImport)) throw new Error("page.js のimport位置を確認できませんでした。");
  source = source.replace(configImport, `${configImport}\n${answerImport}`);
}

const oldDisplay = '              <h2>論点</h2><ShokenPoints text={row.論点} />';
const newDisplay = '              <ShokenAnswerView row={row} />';
if (!source.includes(newDisplay)) {
  if (!source.includes(oldDisplay)) throw new Error("所見の旧表示箇所を確認できませんでした。");
  source = source.replace(oldDisplay, newDisplay);
}

if (source !== original) {
  fs.writeFileSync(pagePath, source, "utf8");
  console.log("生保2の所見答案表示を適用しました。");
} else {
  console.log("生保2の所見答案表示は適用済みです。");
}

let answerSource = fs.readFileSync(answerViewPath, "utf8");
const originalAnswerSource = answerSource;
answerSource = answerSource.replace(
  "1分程度で答案の骨格と加点論点を整理するメモ。本文の章立ては問題文と公式解答例の順序を優先する。",
  "1分程度で答案の骨格と加点論点を整理するメモ。",
);
answerSource = answerSource.replace(
  /<div className=\{styles\.answerHeading\}>\s*<h2>合格レベル答案<\/h2>\s*<span>[^<]*<\/span>\s*<\/div>/u,
  '<div className={styles.answerHeading}><h2>合格レベル答案</h2></div>',
);
answerSource = answerSource.replace(
  /<div className=\{styles\.essayHeading\}>\s*<h3>論文式答案<\/h3>\s*<span>[^<]*<\/span>\s*<\/div>/u,
  '<div className={styles.essayHeading}><h3>論文式答案</h3></div>',
);

if (answerSource !== originalAnswerSource) {
  fs.writeFileSync(answerViewPath, answerSource, "utf8");
  console.log("所見答案の補足文と字数表示を削除しました。");
}

// 本番再デプロイ再試行: 2026-07-28 15:49 JST
