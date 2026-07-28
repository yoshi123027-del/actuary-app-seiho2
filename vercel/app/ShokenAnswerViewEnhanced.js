import styles from "./ShokenAnswerView.module.css";

const ORDER = ["目的", "変化", "影響", "計測", "経営対応"];
const SHORT_SECTIONS = {
  "1": ["① 生命保険会計の意義および特徴"],
  "2": ["① 静的なソルベンシー検証", "① 動的なソルベンシー検証"],
  "3": ["① 契約者配当の四原則", "② 利源別配当方式", "② アセットシェア方式"],
  "4": ["① 利源枠・純保枠のメリットとデメリット", "② EVの意義・考え方・特徴"],
  "5": ["① 区分経理の意義", "② 新商品について新区分を設ける理由"],
  "6": ["① VaRのデメリットとストレステストの意義・目的"],
  "7": ["① 責任準備金の長期性による特徴・基礎率の評価性", "② ロックイン方式のデメリットを補完する現行制度"],
  "8": ["① リスク管理プロセスの六段階", "① 回避・受容・軽減・移転の四カテゴリー"],
  "9": ["（ア）利源分析の意義", "（イ）予定利息の内容と役割", "（イ）解約・失効契約の消滅時保険料積立金"],
  "10": ["（ア）ソルベンシー評価の意義", "（イ）経済価値ベース評価のメリット", "（イ）経済価値ベース評価のデメリット"],
  "11": ["（ア）予定事業費枠の意義と役割", "（イ）商品別原価計算の目的と概要"],
  "12": ["（ア）金利リスク以外の三つの市場リスク", "（イ）流動性リスクと潜在的要因"],
  "13": ["（ア）契約者配当を行う理由"],
  "14": ["（ア）経済価値ベース保険負債評価の概要と法定会計との差", "（イ）死亡率前提上昇の影響", "（イ）解約率前提上昇の影響"],
  "15": ["（ア）内部管理会計の意義と必要性", "（イ）新商品発売当初の費差損益", "（イ）新商品発売当初の責任準備金関係損益"],
  "16": ["（ア）ストレステストの意義・目的"]
};
const FALLBACK_GROUPS = {
  "1": ["現行会計下における、企業活動実態を把握するための管理会計の必要性", "生命保険会社のグローバル展開が進む中、国際的に統一された会計基準を導入する意義および留意点"],
  "2": ["ソルベンシー評価の意義", "適切な責任準備金評価", "財務上の備え・リスク対応能力", "経営への活用"],
  "3": ["A．商品特性の相違を踏まえた配当", "B．金利低下傾向における取扱い", "C．基礎率改定時の新旧契約間調整", "D．発売後年数が短い医療保険の配当率", "総合判断"],
  "4": ["A．純損失の要因および今後の見通し", "B．事業費管理のあり方", "C．単年度収支・将来収支・EVの留意点", "D．具体的な収益管理手法の提案"],
  "5": ["A．区分ごとの損益把握方法", "B．全社区分との関係", "C．区分ごとのリスク管理", "契約者間公平とセルフサポート"],
  "6": ["A．パンデミックシナリオの設定方法", "B．ストレステストにおける確認項目", "C．パンデミックが確認項目に与える影響", "D．テスト結果の活用方法"],
  "7": ["A．ロックフリー方式における計算基礎率の設定", "B．資産評価・収益管理", "C．ソルベンシー管理", "ガバナンス・移行管理"],
  "8": ["A．医療保険販売によるリスクプロファイルの変化", "B．変化したリスクへの対応", "C．リスク管理高度化のための検討事項"],
  "9": ["A．医療保険の特性を踏まえた利源分析", "B．追加責任準備金の利源分析上の取扱い", "分析結果の内部管理・経営施策への活用"],
  "10": ["A．内部管理目的でのソルベンシー評価", "B．健全性確保の方策とリスク管理", "C．収益性向上への活用"],
  "11": ["A．事業費・事業費効率を把握する一般論", "B．インフレ率上昇を踏まえた留意点", "C．IT投資等の経営政策上の留意点"],
  "12": ["A．考慮すべき保険契約者のオプション", "B．資産ポートフォリオ・運用方針", "C．流動性管理と継続的リスク管理"],
  "13": ["A．商品特性の相違を踏まえた配当", "B．新旧予定利率契約の利差配当水準", "C．キャピタルゲイン還元", "総合判断"],
  "14": ["A．経済価値評価の意義と留意点", "B．非経済前提の設定方法と留意点", "C．前提・モデル・結果の妥当性向上と理解促進"],
  "15": ["A．新商品を区分経理する意義", "B．損益把握上の留意点", "C．チャネル・商品間の相乗効果の評価"],
  "16": ["A．商品別・全社的な主要リスク", "B．ストレスシナリオの設定", "C．テスト結果の活用方法"]
};

const HEADING_MAP = {
  "【①何を実現・保護するか】": "目的",
  "【①何を守るのか】": "目的",
  "【目的】": "目的",
  "【②問題文から読み取る変化・制約】": "変化",
  "【②何が変化したのか】": "変化",
  "【変化】": "変化",
  "【③収支・契約者・リスクへの影響】": "影響",
  "【③何に影響するのか】": "影響",
  "【影響】": "影響",
  "【④確認・計測する方法】": "計測",
  "【④どう測るのか】": "計測",
  "【計測】": "計測",
  "【⑤商品・料率・販売・リスク管理への反映】": "経営対応",
  "【⑤どう対応するのか】": "経営対応",
  "【経営対応】": "経営対応"
};

function normalize(text) {
  return String(text || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}
function sentences(text) {
  return normalize(text).split(/(?<=[。！？])|\n+/u).map((part) => part.trim()).filter((part) => part.length >= 8);
}
function answerUnits(text, minimumCount) {
  const units = normalize(text).split(/\n\s*\n/u).map((part) => part.trim()).filter(Boolean);
  while (units.length < minimumCount) {
    let target = -1;
    let pieces = null;
    units.forEach((unit, index) => {
      const list = sentences(unit);
      if (list.length < 2) return;
      if (target < 0 || unit.length > units[target].length) {
        target = index;
        const half = Math.ceil(list.length / 2);
        pieces = [list.slice(0, half).join(""), list.slice(half).join("")];
      }
    });
    if (target < 0) break;
    units.splice(target, 1, ...pieces);
  }
  return units;
}
function compactFramework(text) {
  const buckets = Object.fromEntries(ORDER.map((key) => [key, []]));
  let current = null;
  normalize(text).split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    if (HEADING_MAP[line]) {
      current = HEADING_MAP[line];
      return;
    }
    if (current) buckets[current].push(line);
  });
  return ORDER.map((key) => {
    const clauses = buckets[key].join(" ").replace(/[。！？]/gu, "").split(/[、，]/u).map((part) => part.trim()).filter(Boolean).slice(0, 3);
    return { key, text: clauses.join("・") || "問題文から主要論点を確認" };
  });
}
function extractMajorItems(problem, fallback) {
  const lines = normalize(problem).split("\n").map((line) => line.trim()).filter(Boolean);
  const letterBlocks = [];
  const requestBlocks = [];
  let letters = [];
  let requested = [];
  let inRequestedBlock = false;
  const flushLetters = () => { if (letters.length) letterBlocks.push(letters); letters = []; };
  const flushRequested = () => { if (requested.length) requestBlocks.push(requested); requested = []; };
  lines.forEach((line) => {
    if (/^(①|②|③|④|（[ア-オ]）|\([ア-オ]\))/u.test(line)) {
      flushLetters();
      if (inRequestedBlock) flushRequested();
      inRequestedBlock = false;
    }
    const letter = line.match(/^([Ａ-ＦA-F][．.])\s*(.+)$/u);
    if (letter) {
      letters.push(`${letter[1]} ${letter[2].replace(/。.*$/u, "").trim()}`);
      return;
    }
    if (/以下の(点|論点)|次の(点|観点)|解答にあたっては/u.test(line)) {
      flushRequested();
      inRequestedBlock = true;
      return;
    }
    if (inRequestedBlock && /^[・\-]/u.test(line)) {
      requested.push(line.replace(/^[・\-]\s*/u, "").replace(/。.*$/u, "").trim());
      return;
    }
    if (inRequestedBlock && /^(※|なお、|ただし、)/u.test(line)) {
      flushRequested();
      inRequestedBlock = false;
    }
  });
  flushLetters();
  flushRequested();
  const result = letterBlocks.at(-1) || requestBlocks.at(-1) || [];
  const unique = [...new Set(result)].filter((item) => item.length >= 4).slice(0, 8);
  return unique.length ? unique : fallback;
}
function allocate(items, count) {
  const remaining = [...items];
  return Array.from({ length: count }, (_, index) => {
    if (index === count - 1) return remaining.splice(0);
    const after = count - index - 1;
    const take = Math.max(1, Math.floor(remaining.length / (count - index)));
    return remaining.splice(0, Math.min(take, Math.max(1, remaining.length - after)));
  });
}
function makeBullets(parts) {
  const result = [];
  parts.forEach((part) => {
    sentences(part).forEach((sentence) => {
      const values = sentence.length > 125 ? sentence.split(/(?=また、)|(?=なお、)|(?=一方、)|(?=ただし、)/u) : [sentence];
      values.forEach((value) => {
        const item = normalize(value).replace(/^[-・]\s*/u, "");
        if (item && !result.includes(item)) result.push(item);
      });
    });
  });
  return result;
}
function ensureThree(bullets, title) {
  const result = [...bullets];
  [`${title}について、問題文の前提と基本的な考え方を確認する。`, "契約者間の公平性、収益性および健全性への影響を確認する。", "実施後は計画と実績を比較し、必要に応じて見直す。"].forEach((item) => {
    if (result.length < 3 && !result.includes(item)) result.push(item);
  });
  return result;
}
function frameworkTerms(entries) {
  return entries.flatMap((entry) => entry.text.replace(/[【】「」『』（）()・／,:：。！？]/gu, " ").split(/\s+/u)).filter((term) => term.length >= 3 && term.length <= 14);
}
function capGroups(groups, limit = 3500) {
  const copied = groups.map((group) => ({ ...group, bullets: [...group.bullets] }));
  const count = () => copied.reduce((sum, group) => sum + group.bullets.reduce((inner, bullet) => inner + bullet.length, 0), 0);
  while (count() > limit) {
    const target = [...copied].reverse().find((group) => group.bullets.length > 3);
    if (!target) break;
    target.bullets.pop();
  }
  return { groups: copied, characters: count() };
}
function prepare(row) {
  const id = String(row.id);
  const shortTitles = SHORT_SECTIONS[id] || [];
  const fallback = FALLBACK_GROUPS[id] || ["問題文で指定された論点"];
  const units = answerUnits(row.合格レベル答案, shortTitles.length + fallback.length * 2);
  const shortUnits = units.splice(0, Math.min(shortTitles.length, units.length));
  const shortAnswers = shortTitles.map((title, index) => ({ title, paragraphs: shortUnits[index] ? [shortUnits[index]] : [] }));
  const titles = extractMajorItems(row.問題文, fallback);
  const allocations = allocate(units, titles.length);
  const framework = compactFramework(row.フレームワークを用いた論点整理);
  const terms = frameworkTerms(framework);
  const groups = titles.map((title, index) => ({ title, bullets: ensureThree(makeBullets(allocations[index] || []), title) }));
  return { shortAnswers, framework, terms, ...capGroups(groups) };
}
function Framework({ entries }) {
  return <div className={styles.frameworkBox}>
    <h3>論文式の思考フレーム</h3>
    <p className={styles.frameworkFlow}><strong>{ORDER.join(" → ")}</strong></p>
    {entries.map((entry) => <p key={entry.key}><strong>{entry.key}：</strong>{entry.text}</p>)}
    <p className={styles.frameworkNote}>1分程度で答案の骨格と加点論点を整理するメモ。本文の章立ては問題文と公式解答例の順序を優先する。</p>
  </div>;
}
export default function ShokenAnswerViewEnhanced({ row }) {
  const prepared = prepare(row);
  return <div className={styles.answerView}>
    <section className={styles.section}>
      <div className={styles.answerHeading}><h2>合格レベル答案</h2><span>公式解答例を土台に、問題文の指定構成で整理</span></div>
      {prepared.shortAnswers.map((answer) => <div className={styles.shortAnswer} key={answer.title}><h3>{answer.title}</h3><div className={styles.text}>{answer.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></div>)}
      <Framework entries={prepared.framework} />
      <div className={styles.essayHeading}><h3>論文式答案</h3><span>約{prepared.characters.toLocaleString("ja-JP")}字／3,500字以内</span></div>
      <div className={styles.text}>
        {prepared.groups.map((group, groupIndex) => <section className={styles.majorGroup} key={group.title}>
          <h3 className={styles.majorTitle}>{groupIndex + 1}．{group.title}</h3>
          {group.bullets.map((bullet, index) => {
            const emphasized = prepared.terms.some((term) => bullet.includes(term));
            return <p className={styles.bullet} key={index}>{emphasized ? <strong>{bullet}</strong> : bullet}</p>;
          })}
        </section>)}
      </div>
    </section>
  </div>;
}
