import fs from "node:fs";

const pagePath = new URL("../app/page.js", import.meta.url);
const answerViewPath = new URL("../app/ShokenAnswerViewEnhanced.js", import.meta.url);
let source = fs.readFileSync(pagePath, "utf8");
const original = source;

const configImport = 'import { appConfig } from "./config";';
const answerImport = 'import ShokenAnswerView from "./ShokenAnswerView";';
const questionsImport = 'import questionsData from "../public/questions.json";';
const shokenImport = 'import shokenData from "../public/shoken.json";';

if (!source.includes(answerImport)) {
  if (!source.includes(configImport)) throw new Error("page.js のimport位置を確認できませんでした。");
  source = source.replace(configImport, `${configImport}\n${answerImport}`);
}
if (!source.includes(questionsImport)) {
  source = source.replace(answerImport, `${answerImport}\n${questionsImport}\n${shokenImport}`);
}

const oldDisplay = '              <h2>論点</h2><ShokenPoints text={row.論点} />';
const newDisplay = '              <ShokenAnswerView row={row} />';
if (!source.includes(newDisplay)) {
  if (!source.includes(oldDisplay)) throw new Error("所見の旧表示箇所を確認できませんでした。");
  source = source.replace(oldDisplay, newDisplay);
}

source = source.replace(
  '  const [questions, setQuestions] = useState([]);',
  '  const [questions, setQuestions] = useState(() => questionsData.map(normalizeRow).sort((a, b) => natural(a.id) - natural(b.id)));',
);
source = source.replace(
  '  const [shoken, setShoken] = useState([]);',
  '  const [shoken, setShoken] = useState(() => shokenData.map(normalizeRow));',
);
source = source.replace(
  '      .catch(() => setShoken([]));',
  '      .catch(() => {});',
);

if (source !== original) {
  fs.writeFileSync(pagePath, source, "utf8");
  console.log("所見答案表示と問題データの初期読込を適用しました。");
} else {
  console.log("所見答案表示と問題データの初期読込は適用済みです。");
}

let answerSource = fs.readFileSync(answerViewPath, "utf8");
const oldNote = "1分程度で答案の骨格と加点論点を整理するメモ。本文の章立ては問題文と公式解答例の順序を優先する。";
const newNote = "1分程度で答案の骨格と加点論点を整理するメモ。";
if (answerSource.includes(oldNote)) {
  answerSource = answerSource.replace(oldNote, newNote);
  fs.writeFileSync(answerViewPath, answerSource, "utf8");
  console.log("論文式の思考フレーム注記を簡略化しました。");
}
