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
const stylesImport = 'import styles from "./ShokenAnswerView.module.css";';
const commentImport = 'import QuestionComment from "./QuestionComment";';

if (!answerSource.includes(commentImport)) {
  if (!answerSource.includes(stylesImport)) throw new Error("所見答案コンポーネントのimport位置を確認できませんでした。");
  answerSource = answerSource.replace(stylesImport, `${stylesImport}\n${commentImport}`);
}

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

const commentRender = "      <QuestionComment row={row} />";
if (!answerSource.includes(commentRender)) {
  const closing = "      </div>\n    </section>\n  </div>;";
  if (!answerSource.includes(closing)) throw new Error("所見答案の末尾位置を確認できませんでした。");
  answerSource = answerSource.replace(
    closing,
    `      </div>\n${commentRender}\n    </section>\n  </div>;`,
  );
}

if (answerSource !== originalAnswerSource) {
  fs.writeFileSync(answerViewPath, answerSource, "utf8");
  console.log("生保2の問題別コメントを答案末尾へ追加しました。");
}
