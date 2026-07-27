import fs from "node:fs";

const pagePath = new URL("../app/page.js", import.meta.url);
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
  console.log("所見をフレームワーク整理・合格答案の表示へ切り替えました。");
} else {
  console.log("所見の答案表示は切替済みです。");
}
