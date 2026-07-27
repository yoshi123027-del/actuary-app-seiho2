import { readFile, writeFile } from "node:fs/promises";

const sourceUrl = new URL("../../shoken.csv", import.meta.url);
const outputUrl = new URL("../public/shoken.json", import.meta.url);

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

const csv = await readFile(sourceUrl, "utf8");
const records = parseCsv(csv);
const requiredHeaders = ["年度", "問題番号", "問題文", "論点"];
const missingHeaders = requiredHeaders.filter(
  (header) => !Object.prototype.hasOwnProperty.call(records[0] || {}, header),
);

if (missingHeaders.length) {
  throw new Error("shoken.csv に必要な列がありません: " + missingHeaders.join(", "));
}

await writeFile(outputUrl, JSON.stringify(records, null, 2) + "\n", "utf8");
console.log("shoken.csv から " + records.length + " 件を同期しました。");
