import { readFile, writeFile } from "node:fs/promises";
import answerRecords from "../../shoken-answers.mjs";

const sourceUrl = new URL("../../shoken.csv", import.meta.url);
const outputUrl = new URL("../public/shoken.json", import.meta.url);

const USER_ANSWER_LAYOUTS = {
  "1": { essayMarker: "〇現行会計下における", shortBreaks: [] },
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text).replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = (rows.shift() || []).map((value) => value.trim());
  return rows
    .filter((values) => values.some((value) => value !== ""))
    .map((values) => Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    ));
}

function collapse(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function splitAtMarkers(text, markers) {
  const source = String(text || "");
  const positions = markers
    .map((marker) => ({ marker, index: source.indexOf(marker) }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index);
  const result = [];
  let start = 0;
  for (const item of positions) {
    const part = collapse(source.slice(start, item.index));
    if (part) result.push(part);
    start = item.index;
  }
  const tail = collapse(source.slice(start));
  if (tail) result.push(tail);
  return result;
}

function normalizeUserAnswer(id, text) {
  const layout = USER_ANSWER_LAYOUTS[id];
  if (!layout) return String(text || "").trim();
  const source = String(text || "").trim();
  const essayIndex = source.indexOf(layout.essayMarker);
  if (essayIndex < 0) return source;
  const shortText = source.slice(0, essayIndex);
  const essayText = source.slice(essayIndex).trim();
  const shortParts = splitAtMarkers(shortText, layout.shortBreaks);
  return [...shortParts, essayText].filter(Boolean).join("\n\n");
}

async function readUserAnswer(id) {
  try {
    const url = new URL(`../../shoken-user-answers/${id}.txt`, import.meta.url);
    const text = await readFile(url, "utf8");
    return normalizeUserAnswer(id, text);
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

const csv = await readFile(sourceUrl, "utf8");
const sourceRecords = parseCsv(csv);
const requiredHeaders = ["年度", "問題番号", "問題文"];
const missingHeaders = requiredHeaders.filter(
  (header) => !Object.prototype.hasOwnProperty.call(sourceRecords[0] || {}, header),
);

if (missingHeaders.length) {
  throw new Error("shoken.csv に必要な列がありません: " + missingHeaders.join(", "));
}

const records = await Promise.all(sourceRecords.map(async (record) => {
  const id = String(record.id || "");
  const answer = answerRecords[id];
  if (!answer?.フレームワークを用いた論点整理 || !answer?.合格レベル答案) {
    throw new Error(`所見答案データが未登録です: id=${id}`);
  }
  const userAnswer = await readUserAnswer(id);
  const { 論点: _discardedOriginalPoints, ...base } = record;
  return {
    ...base,
    ...answer,
    ...(userAnswer ? { 合格レベル答案: userAnswer } : {}),
  };
}));

await writeFile(outputUrl, JSON.stringify(records, null, 2) + "\n", "utf8");
console.log("shoken.csv と合格答案から " + records.length + " 件を同期しました。");